const { getStore } = require("@netlify/blobs");

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

    const guidelineText = fetchedContent || additionalContent
    if (!guidelineText) return { statusCode: 400, body: JSON.stringify({ error: 'No content provided' }) }

    // Trim content to keep AI response fast — 20000 chars is plenty for extraction
    const trimmedText = guidelineText.length > 20000
      ? guidelineText.substring(0, 20000) + '\n...[truncated]'
      : guidelineText

    const now = new Date().toISOString()
    const allUrls = additionalUrls ? [...(mp.guidelineUrls || []), ...additionalUrls] : (mp.guidelineUrls || [])

    const prompt = `Extract ALL listing requirements from this "${mp.name}" marketplace documentation. Be concise but complete.

${trimmedText}

Return ONLY valid JSON (no preamble, no fences):
{
  "maxTitle": <number or null>,
  "maxShortDesc": <number or null>,
  "maxDesc": <number or null>,
  "maxFeatures": <number or null>,
  "maxFeatureLen": <number or null>,
  "maxTags": <number or null>,
  "tone": "<required writing tone and style>",
  "featureRequirements": "<what each feature entry must include — title, description, image specs>",
  "iconSpec": "<icon dimensions, format, file size, background rules>",
  "screenshotSpec": "<screenshot dimensions, quantity, format, content rules>",
  "rules": ["<every naming, content, branding, URL, and compliance rule as a separate string>"],
  "nextSteps": ["<every submission step, image requirement, and post-listing requirement>"],
  "lastScanned": "${now}"
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
    const guidelines = JSON.parse(jsonMatch[0])

    const updatedMp = {
      ...mp,
      guidelineUrls: allUrls,
      guidelines: {
        ...guidelines,
        rules: ['Long description must be plain text only — no HTML, no markdown, no heading tags', ...(guidelines.rules || [])]
      }
    }

    const updatedList = list.map(m => m.id === id ? updatedMp : m)
    await store.setJSON("list", updatedList)

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedMp) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}