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
    const { name, urls, fetchedContent } = JSON.parse(event.body)
    if (!name || !fetchedContent) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Name and content are required' }) }
    }

    const now = new Date().toISOString()

    const prompt = `You are analyzing official app marketplace listing guidelines. Below is the full content from the "${name}" marketplace's official documentation pages.

Your job is to extract EVERY requirement, rule, limit, and specification — including requirements for features, descriptions, images, videos, icons, naming conventions, branding rules, pricing rules, character limits, submission steps, and anything else a developer needs to know to create a compliant listing.

Be extremely thorough. Do not miss anything. If a field has specific formatting requirements (e.g. features need an image and description, icons must be 800x800px), include all of those details.

DOCUMENTATION CONTENT:
${fetchedContent}

Return ONLY valid JSON with this exact structure (no preamble, no markdown fences):
{
  "maxTitle": 50,
  "maxShortDesc": 200,
  "maxDesc": 1500,
  "maxFeatures": 5,
  "maxFeatureLen": 100,
  "maxTags": 5,
  "tone": "describe the appropriate writing tone for this marketplace",
  "rules": ["every content rule, naming convention, branding restriction, URL requirement, pricing rule, scope requirement, and compliance requirement as separate strings"],
  "nextSteps": ["every image spec with dimensions and format, video requirement, icon requirement, screenshot requirement, feature card requirement, submission step, and post-listing requirement as separate strings"],
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
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) {
      const err = await response.json()
      return { statusCode: response.status, body: JSON.stringify({ error: err.error?.message || 'AI extraction failed' }) }
    }

    const data = await response.json()
    const text = data.content.map(i => i.text || '').join('')
    let clean = text.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI did not return valid JSON' }) }
    }
    const guidelines = JSON.parse(jsonMatch[0])

    const id = 'custom_' + Date.now()
    const marketplace = {
      id,
      name,
      color: '#7c6af7',
      textColor: '#fff',
      icon: name.substring(0, 2).toUpperCase(),
      publishable: false,
      guidelineUrls: urls || [],
      guidelines: {
        ...guidelines,
        rules: [
          'Long description must be plain text only — no HTML no markdown no heading tags',
          ...(guidelines.rules || [])
        ]
      }
    }

    let store, existing
    try {
      store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })
      existing = await store.get("list", { type: "json" }) || []
    } catch (blobErr) {
      existing = []
      store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })
    }

    try {
      existing.push(marketplace)
      await store.setJSON("list", existing)
    } catch (blobErr) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save marketplace: ' + blobErr.message }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(marketplace)
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}