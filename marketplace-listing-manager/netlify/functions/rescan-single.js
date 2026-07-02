const { getStore } = require("@netlify/blobs");

// Sensible fallback limits used only when a marketplace's docs don't state an explicit number.
// Generous on purpose so they rarely trim real content — they exist so the UI always shows a number.
const DEFAULT_LIMITS = { maxTitle: 40, maxShortDesc: 200, maxDesc: 4000, maxFeatures: 8, maxFeatureLen: 160, maxTags: 6 }

function withDefaults(g) {
  const out = { ...g }
  for (const k of Object.keys(DEFAULT_LIMITS)) {
    if (typeof out[k] !== 'number' || out[k] <= 0) out[k] = DEFAULT_LIMITS[k]
  }
  return out
}

// Merge two arrays of strings, skipping case-insensitive duplicates
function mergeArrays(oldArr = [], newArr = []) {
  const seen = new Set((oldArr || []).map(s => String(s).trim().toLowerCase()))
  const merged = [...(oldArr || [])]
  for (const item of (newArr || [])) {
    const key = String(item).trim().toLowerCase()
    if (key && !seen.has(key)) {
      seen.add(key)
      merged.push(item)
    }
  }
  return merged
}

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }
  }

  try {
    const { id, fetchedContent, additionalUrls, additionalContent } = JSON.parse(event.body)

    const store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })
    const list = await store.get("list", { type: "json" }) || []
    const mp = list.find(m => m.id === id)

    if (!mp) return { statusCode: 404, body: JSON.stringify({ error: 'Marketplace not found' }) }

    // MERGE mode = "Add URLs" (additive). REPLACE mode = "Rescan" (full refresh).
    const isMerge = !!(additionalContent && additionalUrls && additionalUrls.length > 0)
    const guidelineText = isMerge ? additionalContent : fetchedContent
    if (!guidelineText) return { statusCode: 400, body: JSON.stringify({ error: 'No content provided' }) }

    const trimmedText = guidelineText.length > 20000
      ? guidelineText.substring(0, 20000) + '\n...[truncated]'
      : guidelineText

    const now = new Date().toISOString()
    const prevG = mp.guidelines || {}
    const allUrls = isMerge ? [...(mp.guidelineUrls || []), ...additionalUrls] : (mp.guidelineUrls || [])

    const prompt = `You are extracting app marketplace LISTING guidelines for "${mp.name}". Your output is used ONLY to write and validate the marketplace listing (the copy, images, links, and assets a customer sees). Nothing else.

INCLUDE only things that change what goes INTO the listing:
- Character/length limits for listing fields: app name/title, tagline/short description, long description/overview, feature titles and descriptions, tags/keywords
- Required tone, voice, and point of view for the copy
- What the description MUST and MUST NOT contain (e.g. plain text only, no HTML/markdown, no competitor names, no unsupported claims, no pricing inside the description)
- App name / naming rules (prohibited words, forbidden use of the marketplace's brand name)
- Feature/section format (does each feature need a title, description, image? how many?)
- Image, icon, screenshot, and video specs — exact dimensions, format, count, aspect ratio, content rules
- Required links and their rules (setup guide, support URL, privacy policy, install/CTA button)
- Category and tag selection rules

HARD EXCLUDE — never output any of these, even if the documentation is full of them:
- OAuth versions or endpoints (e.g. /oauth/2026-03/token), API versions, SDKs
- Developer platform version numbers (e.g. v2025.2, v2026.03), migration deadlines, "supported version" requirements
- Legacy CRM cards, app cards, UI extensions, uninstall API, install caps, distribution mechanics
- Security questionnaires, testing credentials, certification/recertification code requirements
- Anything a developer does in CODE rather than in the listing copy
IMPORTANT: If a source page is a changelog, release note, or developer update about platform/API/OAuth/migrations, extract NOTHING from it unless it literally changes the listing text, images, links, or video. These pages are noise for listing generation.

For every numeric limit: only fill it if the documentation states an explicit number. If no explicit character limit is given, return null for that field — do NOT guess.

DOCUMENTATION CONTENT:
${trimmedText}

Return ONLY valid JSON (no preamble, no code fences):
{
  "maxTitle": <number or null>,
  "maxShortDesc": <number or null>,
  "maxDesc": <number or null>,
  "maxFeatures": <number or null>,
  "maxFeatureLen": <number or null>,
  "maxTags": <number or null>,
  "tone": "<required writing tone, voice, and point of view for the copy>",
  "featureRequirements": "<what each feature entry must include - title, description, image and its specs>",
  "iconSpec": "<icon dimensions, format, file size, background rules - or empty>",
  "screenshotSpec": "<screenshot dimensions, count, format, content rules - or empty>",
  "videoSpec": "<video platform, length, content rules - or empty if not required>",
  "rules": ["<each LISTING-COPY rule as a clear directive, e.g. 'App name must not contain the word HubSpot or Hub'>"],
  "nextSteps": ["<each asset or link the person must prepare, e.g. 'Prepare an 800x800px PNG or JPG app icon that fills the frame'>"]
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
    })

    if (!response.ok) {
      const err = await response.json()
      return { statusCode: response.status, body: JSON.stringify({ error: err.error?.message || 'AI scan failed' }) }
    }

    const data = await response.json()
    const text = data.content.map(i => i.text || '').join('')
    let clean = text.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { statusCode: 500, body: JSON.stringify({ error: 'AI did not return valid JSON' }) }
    const extracted = JSON.parse(jsonMatch[0])

    const plainTextRule = 'Long description must be plain text only — no HTML, no markdown, no heading tags'

    let mergedGuidelines
    if (isMerge) {
      // ADD URLs: keep existing values, fill gaps and append new items — never wipe what's there
      mergedGuidelines = {
        maxTitle: prevG.maxTitle ?? extracted.maxTitle ?? null,
        maxShortDesc: prevG.maxShortDesc ?? extracted.maxShortDesc ?? null,
        maxDesc: prevG.maxDesc ?? extracted.maxDesc ?? null,
        maxFeatures: prevG.maxFeatures ?? extracted.maxFeatures ?? null,
        maxFeatureLen: prevG.maxFeatureLen ?? extracted.maxFeatureLen ?? null,
        maxTags: prevG.maxTags ?? extracted.maxTags ?? null,
        tone: prevG.tone || extracted.tone || '',
        featureRequirements: prevG.featureRequirements || extracted.featureRequirements || '',
        iconSpec: prevG.iconSpec || extracted.iconSpec || '',
        screenshotSpec: prevG.screenshotSpec || extracted.screenshotSpec || '',
        videoSpec: prevG.videoSpec || extracted.videoSpec || '',
        rules: mergeArrays(prevG.rules, [plainTextRule, ...(extracted.rules || [])]),
        nextSteps: mergeArrays(prevG.nextSteps, extracted.nextSteps),
        lastScanned: now
      }
    } else {
      // RESCAN: rebuild from scratch, but keep an old numeric limit if the fresh scan misses one
      mergedGuidelines = {
        ...extracted,
        maxTitle: extracted.maxTitle ?? prevG.maxTitle ?? null,
        maxShortDesc: extracted.maxShortDesc ?? prevG.maxShortDesc ?? null,
        maxDesc: extracted.maxDesc ?? prevG.maxDesc ?? null,
        maxFeatures: extracted.maxFeatures ?? prevG.maxFeatures ?? null,
        maxFeatureLen: extracted.maxFeatureLen ?? prevG.maxFeatureLen ?? null,
        maxTags: extracted.maxTags ?? prevG.maxTags ?? null,
        rules: mergeArrays([plainTextRule], extracted.rules),
        nextSteps: extracted.nextSteps || [],
        lastScanned: now
      }
    }

    // Backfill any still-missing numeric limit with a sensible default so the UI always shows a number
    mergedGuidelines = withDefaults(mergedGuidelines)

    const updatedMp = { ...mp, guidelineUrls: allUrls, guidelines: mergedGuidelines }
    const updatedList = list.map(m => m.id === id ? updatedMp : m)
    await store.setJSON("list", updatedList)

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedMp) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}