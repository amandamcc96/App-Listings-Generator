// Extracts listing guidelines from ONE page of content.
// Called once per URL by the browser so each request stays small and fast (no timeouts).

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
- OAuth versions or endpoints (e.g. /oauth/2026-03/token), API versions, SDKs
- Developer platform version numbers (e.g. v2025.2, v2026.03), migration deadlines, "supported version" requirements
- Legacy CRM cards, app cards, UI extensions, uninstall API, install caps, distribution mechanics
- Security questionnaires, testing credentials, certification/recertification code requirements
- Anything a developer does in CODE rather than in the listing copy
IMPORTANT: If this page is a changelog, release note, or developer update about platform/API/OAuth/migrations, return empty arrays and null limits — extract NOTHING unless it literally changes the listing text, images, links, or video.

For every numeric limit (max OR min): only fill it if this page states an explicit number. If a number is not stated, return null for that field. NEVER guess or invent a number.

PAGE CONTENT:
${content}

Return ONLY valid JSON (no preamble, no code fences):
{
  "maxTitle": <number or null>,
  "minTitle": <number or null>,
  "maxShortDesc": <number or null>,
  "minShortDesc": <number or null>,
  "maxDesc": <number or null>,
  "minDesc": <number or null>,
  "maxFeatures": <number or null>,
  "minFeatures": <number or null>,
  "maxFeatureLen": <number or null>,
  "maxTags": <number or null>,
  "minTags": <number or null>,
  "tone": "<required writing tone, voice, and point of view for the copy - or empty>",
  "featureRequirements": "<the EXACT required format for each feature entry - or empty>",
  "iconSpec": "<icon dimensions, format, file size, background rules - or empty>",
  "screenshotSpec": "<screenshot dimensions, count, format, content rules - or empty>",
  "videoSpec": "<video platform, length, content rules - or empty>",
  "rules": ["<each LISTING-COPY rule as a clear directive>"],
  "nextSteps": ["<each asset or link the person must prepare>"]
}`

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }
  }

  try {
    const { name, content } = JSON.parse(event.body)
    if (!name || !content) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Name and content are required' }) }
    }

    // One page only — keep it small so this always finishes well under the timeout
    const trimmed = content.length > 12000 ? content.substring(0, 12000) + '\n...[truncated]' : content

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: LISTING_PROMPT(name, trimmed) }] })
    })

    if (!response.ok) {
      const err = await response.json()
      return { statusCode: response.status, body: JSON.stringify({ error: err.error?.message || 'AI extraction failed' }) }
    }

    const data = await response.json()
    const text = data.content.map(i => i.text || '').join('')
    let clean = text.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { statusCode: 500, body: JSON.stringify({ error: 'AI did not return valid JSON' }) }
    const guidelines = JSON.parse(jsonMatch[0])

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guidelines }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}