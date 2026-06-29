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

    const prompt = `You are a compliance specialist analyzing official app marketplace listing guidelines for "${name}".

Below is the FULL content fetched directly from their official documentation pages. Your job is to extract EVERY SINGLE requirement — nothing can be missed, as developers will rely on this to build compliant listings.

EXTRACT ALL OF THE FOLLOWING WITHOUT EXCEPTION:
1. Character limits for every field (title, short description, long description, features, tags, etc.)
2. Feature requirements — do features need a title? A description? An image/screenshot? What are the specs?
3. Icon requirements — dimensions, format (PNG/SVG/etc.), background rules, file size limits
4. Screenshot requirements — dimensions, quantity (min/max), format, content restrictions
5. Video requirements — platform (YouTube/Vimeo), length limits, content rules
6. Tone and writing style rules — first person vs third person, prohibited phrases, required phrases
7. Content restrictions — what is NOT allowed in descriptions (HTML, markdown, links, competitor mentions, etc.)
8. Naming rules — what can/cannot be in the app name, whether "for [Platform]" suffix is required
9. Pricing and commercial rules — free tier requirements, pricing display rules, trial requirements
10. Branding rules — trademark usage, logo usage, platform name usage guidelines
11. Category/tag rules — how many, which are allowed, how to choose
12. Submission and review process steps — what happens after submitting, review timeline, what gets checked
13. Post-listing requirements — what must be maintained, update frequency, support requirements
14. Any recent updates or changes to requirements (changelogs)
15. Any requirements specific to listing page sections (overview, features, pricing, support, etc.)

DOCUMENTATION CONTENT:
${fetchedContent}

Return ONLY valid JSON with this exact structure (no preamble, no markdown fences, no commentary):
{
  "maxTitle": <number or null if not specified>,
  "maxShortDesc": <number or null if not specified>,
  "maxDesc": <number or null if not specified>,
  "maxFeatures": <number or null if not specified>,
  "maxFeatureLen": <number or null if not specified>,
  "maxTags": <number or null if not specified>,
  "tone": "<describe the exact required writing tone, person (first/third), style, and any specific voice requirements>",
  "featureRequirements": "<describe exactly what each feature entry must include — title only? title + description? title + description + image? image specs?>",
  "iconSpec": "<exact icon dimensions, format, file size limit, background color rules, and any other icon requirements>",
  "screenshotSpec": "<exact screenshot dimensions, min/max quantity, format, content rules, caption requirements>",
  "videoSpec": "<video platform requirements, length limits, content rules, or 'not required' if not mentioned>",
  "rules": [
    "<each rule as a complete, specific, actionable sentence>",
    "<include every naming rule, content restriction, branding rule, prohibited element, required element>",
    "<be specific — e.g. 'App name must not exceed 50 characters and must not include the word App' not just 'follow naming rules'>"
  ],
  "nextSteps": [
    "<each submission step as a specific actionable instruction>",
    "<include every image/asset requirement, review process step, post-listing maintenance requirement>",
    "<include any recent requirement changes from changelogs>"
  ],
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
        max_tokens: 6000,
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
          'Long description must be plain text only — no HTML, no markdown, no heading tags',
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