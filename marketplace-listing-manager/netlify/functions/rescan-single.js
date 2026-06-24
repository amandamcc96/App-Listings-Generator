const { getStore } = require("@netlify/blobs");

async function fetchUrlContent(url) {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'CommercientListingManager/1.0' }
    })
    if (!resp.ok) return null
    const html = await resp.text()
    let text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ').trim()
    if (text.length > 4000) text = text.substring(0, 4000) + '...'
    return text
  } catch (e) { return null }
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
    const { id } = JSON.parse(event.body)
const store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })
    const list = await store.get("list", { type: "json" }) || []
    const mp = list.find(m => m.id === id)

    if (!mp) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Marketplace not found' }) }
    }

    const urls = mp.guidelineUrls || []
    if (urls.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No guideline URLs to scan' }) }
    }

    const contents = []
    for (const url of urls) {
      const content = await fetchUrlContent(url)
      if (content) contents.push(`[Source: ${url}]\n${content}`)
    }

    if (contents.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Could not fetch content from URLs' }) }
    }

    const guidelineText = contents.join('\n\n---\n\n')
    const now = new Date().toISOString()

    const prompt = `You are analyzing app marketplace listing guidelines. Below is the actual content from the "${mp.name}" marketplace's official documentation pages.

Extract ALL listing requirements and format them as a structured JSON object. Be thorough — capture every character limit, content rule, image requirement, and submission requirement mentioned.

DOCUMENTATION CONTENT:
${guidelineText}

Return ONLY valid JSON with this exact structure (no preamble, no markdown fences):
{
  "maxTitle": <number or 0 if not specified>,
  "maxShortDesc": <number or 0 if not specified>,
  "maxDesc": <number or 0 if not specified>,
  "maxFeatures": <number, default 5>,
  "maxFeatureLen": <number, default 100>,
  "maxTags": <number, default 5>,
  "tone": "<recommended writing tone based on the marketplace>",
  "rules": ["<every content rule, naming rule, branding rule, restriction, and requirement as a separate string>"],
  "nextSteps": ["<every image requirement, screenshot spec, video requirement, submission step, and post-listing requirement as a separate string>"],
  "lastScanned": "${now}"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const err = await response.json()
      return { statusCode: response.status, body: JSON.stringify({ error: err.error?.message || 'AI scan failed' }) }
    }

    const data = await response.json()
    const text = data.content.map(i => i.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const guidelines = JSON.parse(clean)

    // Update marketplace in storage
    const updatedMp = {
      ...mp,
      guidelines: {
        ...guidelines,
        rules: [
          'Long description must be plain text only — no HTML no markdown no heading tags',
          ...(guidelines.rules || [])
        ]
      }
    }

    const updatedList = list.map(m => m.id === id ? updatedMp : m)
    await store.setJSON("list", updatedList)

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedMp)
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}