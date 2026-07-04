const { getStore } = require("@netlify/blobs");

// Rolling scheduled rescan. Each invocation does ONE small step (fetch + extract one URL),
// storing progress in Blobs, so no run ever approaches the function timeout.
// When all URLs of a marketplace are processed, the fragments are merged (most-restrictive
// limits win) and that marketplace's guidelines are replaced. A marketplace becomes due
// when its lastScanned is older than STALE_DAYS.

const STALE_DAYS = 170 // roughly six months

const NUM_FIELDS = ['maxTitle','minTitle','maxShortDesc','minShortDesc','maxDesc','minDesc','maxFeatures','minFeatures','maxFeatureLen','maxTags','minTags']
const STR_FIELDS = ['tone','featureRequirements','iconSpec','screenshotSpec','videoSpec']

const LISTING_PROMPT = (name, content) => `You are extracting app marketplace LISTING guidelines for "${name}". Your output is used ONLY to write and validate the marketplace listing (the copy, images, links, and assets a customer sees). Nothing else.

INCLUDE only things that change what goes INTO the listing:
- Character/length limits for listing fields: app name/title, tagline/short description, long description/overview, feature titles and descriptions, tags/keywords. Capture BOTH maximums AND minimums exactly as stated (e.g. "the overview must be at least 160 characters").
- Minimum required counts (e.g. "provide at least 3 screenshots", "at least 1 feature").
- Required tone, voice, and point of view for the copy
- What the description MUST and MUST NOT contain (e.g. plain text only, no HTML/markdown, no competitor names, no unsupported claims, no pricing inside the description)
- App name / naming rules (prohibited words, forbidden use of the marketplace's brand name)
- The exact required FORMAT for features/sections (does each feature need a title, a description of how customers use it, an image? how should each be structured?)
- Image, icon, screenshot, and video specs — exact dimensions, format, count, aspect ratio, content rules
- Required links and their rules (setup guide, support URL, privacy policy, install/CTA button)
- Category and tag selection rules

HARD EXCLUDE — never output any of these, even if the documentation is full of them:
- OAuth versions or endpoints, API versions, SDKs
- Developer platform version numbers, migration deadlines, "supported version" requirements
- Legacy CRM cards, app cards, UI extensions, uninstall API, install caps, distribution mechanics
- Security questionnaires, testing credentials, certification/recertification code requirements
- Anything a developer does in CODE rather than in the listing copy
IMPORTANT: If this page is a changelog, release note, or developer update about platform/API/OAuth/migrations, return empty arrays and null limits — extract NOTHING unless it literally changes the listing text, images, links, or video.

For every numeric limit (max OR min): only fill it if this page states an explicit number. If a number is not stated, return null for that field. NEVER guess or invent a number.

PAGE CONTENT:
${content}

Return ONLY valid JSON (no preamble, no code fences):
{
  "maxTitle": <number or null>, "minTitle": <number or null>,
  "maxShortDesc": <number or null>, "minShortDesc": <number or null>,
  "maxDesc": <number or null>, "minDesc": <number or null>,
  "maxFeatures": <number or null>, "minFeatures": <number or null>,
  "maxFeatureLen": <number or null>,
  "maxTags": <number or null>, "minTags": <number or null>,
  "tone": "", "featureRequirements": "", "iconSpec": "", "screenshotSpec": "", "videoSpec": "",
  "rules": [], "nextSteps": []
}`

function mergeFragments(fragments) {
  const out = { rules: [], nextSteps: [] }
  STR_FIELDS.forEach(f => { out[f] = '' })
  NUM_FIELDS.forEach(f => { out[f] = null })
  const seenRule = new Set(), seenStep = new Set()
  for (const g of fragments) {
    if (!g) continue
    for (const f of NUM_FIELDS) {
      const v = g[f]
      if (typeof v === 'number' && v > 0) {
        if (out[f] == null) out[f] = v
        else out[f] = f.startsWith('max') ? Math.min(out[f], v) : Math.max(out[f], v)
      }
    }
    for (const f of STR_FIELDS) { if (!out[f] && g[f]) out[f] = g[f] }
    for (const r of (g.rules || [])) { const k = String(r).trim().toLowerCase(); if (r && !seenRule.has(k)) { seenRule.add(k); out.rules.push(r) } }
    for (const s of (g.nextSteps || [])) { const k = String(s).trim().toLowerCase(); if (s && !seenStep.has(k)) { seenStep.add(k); out.nextSteps.push(s) } }
  }
  return out
}

async function fetchPage(url) {
  try {
    const resp = await fetch(`https://r.jina.ai/${url}`, { headers: { 'Accept': 'text/plain', 'User-Agent': 'CommercientListingManager/1.0' } })
    if (!resp.ok) return null
    let text = await resp.text()
    if (text.length > 8000) text = text.substring(0, 8000) + '...'
    return text.length > 100 ? text : null
  } catch (e) { return null }
}

async function extractPage(apiKey, name, content) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: LISTING_PROMPT(name, content) }] })
  })
  if (!response.ok) return null
  const data = await response.json()
  const text = data.content.map(i => i.text || '').join('')
  const clean = text.replace(/```json|```/g, '').trim()
  const jsonMatch = clean.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return null
  try { return JSON.parse(jsonMatch[0]) } catch { return null }
}

exports.handler = async function(event, context) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }

  try {
    const store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })
    const list = await store.get("list", { type: "json" }) || []
    if (list.length === 0) return { statusCode: 200, body: JSON.stringify({ message: 'No marketplaces' }) }

    // Load in-progress state, discarding it if its marketplace no longer exists
    let state = null
    try { state = await store.get("rescan-state", { type: "json" }) } catch { state = null }
    if (state && !list.find(m => m.id === state.mpId)) state = null

    // No job in progress: find the stalest marketplace past the threshold and start one
    if (!state) {
      const cutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000
      const due = list
        .filter(m => (m.guidelineUrls || []).length > 0)
        .map(m => ({ m, t: Date.parse(m.guidelines?.lastScanned || 0) || 0 }))
        .filter(x => x.t < cutoff)
        .sort((a, b) => a.t - b.t)
      if (due.length === 0) {
        return { statusCode: 200, body: JSON.stringify({ message: 'All marketplaces are fresh' }) }
      }
      state = { mpId: due[0].m.id, urlIndex: 0, fragments: [] }
    }

    const mp = list.find(m => m.id === state.mpId)
    const urls = mp.guidelineUrls || []

    // Do ONE step: fetch + extract the next URL
    if (state.urlIndex < urls.length) {
      const url = urls[state.urlIndex]
      const content = await fetchPage(url)
      const frag = content ? await extractPage(apiKey, mp.name, content) : null
      state.fragments.push(frag) // may be null; merge skips nulls
      state.urlIndex++
    }

    // Not finished yet: save progress and exit
    if (state.urlIndex < urls.length) {
      await store.setJSON("rescan-state", state)
      return { statusCode: 200, body: JSON.stringify({ message: `Rescanning ${mp.name}: ${state.urlIndex}/${urls.length} pages done` }) }
    }

    // Finished all URLs: merge and update this marketplace (replace mode, like a manual Rescan)
    const validFragments = state.fragments.filter(Boolean)
    const prevG = mp.guidelines || {}
    const now = new Date().toISOString()
    const plainTextRule = 'Long description must be plain text only — no HTML, no markdown, no heading tags'

    let g
    if (validFragments.length === 0) {
      // Every page failed — keep existing guidelines, just bump lastScanned so it retries in the next cycle rather than looping daily
      g = { ...prevG, lastScanned: now }
    } else {
      const extracted = mergeFragments(validFragments)
      g = {
        tone: extracted.tone || prevG.tone || '',
        featureRequirements: extracted.featureRequirements || prevG.featureRequirements || '',
        iconSpec: extracted.iconSpec || '',
        screenshotSpec: extracted.screenshotSpec || '',
        videoSpec: extracted.videoSpec || '',
        rules: [plainTextRule, ...extracted.rules.filter(r => r.trim().toLowerCase() !== plainTextRule.toLowerCase())],
        nextSteps: extracted.nextSteps,
        lastScanned: now
      }
      for (const f of NUM_FIELDS) {
        g[f] = (typeof extracted[f] === 'number' && extracted[f] > 0) ? extracted[f]
             : (typeof prevG[f] === 'number' && prevG[f] > 0) ? prevG[f] : null
      }
    }

    const freshList = await store.get("list", { type: "json" }) || []
    const updatedList = freshList.map(m => m.id === mp.id ? { ...m, guidelines: g } : m)
    await store.setJSON("list", updatedList)
    await store.setJSON("rescan-state", null)

    return { statusCode: 200, body: JSON.stringify({ message: `Rescanned ${mp.name} (${validFragments.length}/${urls.length} pages)` }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}