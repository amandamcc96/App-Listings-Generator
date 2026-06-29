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

    // Use either pre-fetched content (rescan) or additional content (add URLs)
    const guidelineText = fetchedContent || additionalContent
    if (!guidelineText) return { statusCode: 400, body: JSON.stringify({ error: 'No content provided' }) }

    const now = new Date().toISOString()
    const allUrls = additionalUrls ? [...(mp.guidelineUrls || []), ...additionalUrls] : (mp.guidelineUrls || [])

    const prompt = `You are analyzing official app marketplace listing guidelines for "${mp.name}". Extract EVERY requirement, rule, limit, and specification — including feature formatting, images, videos, icons, naming rules, character limits, submission steps, and anything else needed for a compliant listing.

DOCUMENTATION CONTENT:
${guidelineText}

Return ONLY valid JSON (no preamble, no fences):
{
  "maxTitle": 50,
  "maxShortDesc": 200,
  "maxDesc": 1500,
  "maxFeatures": 5,
  "maxFeatureLen": 100,
  "maxTags": 5,
  "tone": "appropriate writing tone",
  "rules": ["every rule as a separate string"],
  "nextSteps": ["every image spec, video requirement, submission step as a separate string"],
  "lastScanned": "${now}"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] })
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
        rules: ['Long description must be plain text only — no HTML no markdown no heading tags', ...(guidelines.rules || [])]
      }
    }

    const updatedList = list.map(m => m.id === id ? updatedMp : m)
    await store.setJSON("list", updatedList)

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedMp) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}