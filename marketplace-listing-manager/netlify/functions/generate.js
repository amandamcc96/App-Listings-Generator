async function fetchGuidelineContent(urls) {
  if (!urls || urls.length === 0) return ''

  const results = []
  for (const url of urls) {
    try {
      // Use Jina AI reader to handle JavaScript-rendered pages
      const jinaUrl = `https://r.jina.ai/${url}`
      const resp = await fetch(jinaUrl, {
        headers: {
          'User-Agent': 'CommercientListingManager/1.0',
          'Accept': 'text/plain'
        }
      })
      if (!resp.ok) continue
      let text = await resp.text()
      text = text.trim()

      // Allow up to 12000 chars per URL to capture full requirements
      if (text.length > 12000) {
        text = text.substring(0, 12000) + '\n...[content truncated]'
      }

      if (text.length > 100) {
        results.push(`[Source: ${url}]\n${text}`)
      }
    } catch (e) {
      // Skip failed URLs silently
    }
  }

  return results.join('\n\n---\n\n')
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
    const body = JSON.parse(event.body)
    const { prompt, guidelineUrls } = body

    // Fetch live guideline content via Jina AI if URLs are provided
    let guidelineContent = ''
    if (guidelineUrls && guidelineUrls.length > 0) {
      guidelineContent = await fetchGuidelineContent(guidelineUrls)
    }

    // Build the full prompt with live guidelines as context
    let fullPrompt = prompt
    if (guidelineContent) {
      fullPrompt = `${prompt}

========================================================
LIVE MARKETPLACE GUIDELINES — OFFICIAL DOCUMENTATION
========================================================
The following content was fetched directly from the marketplace's official guideline pages using a JavaScript-capable reader. This is the PRIMARY and authoritative source of truth for this listing.

CRITICAL INSTRUCTIONS:
- Read every guideline below carefully before generating anything
- Every field you generate MUST comply with the character limits, formatting rules, tone requirements, and content restrictions stated in these guidelines
- Pay special attention to: feature requirements (some marketplaces require an image + title + description per feature), icon specs, screenshot specs, video requirements, naming rules, prohibited words/phrases, and submission steps
- If the guidelines specify what must or must not be included in descriptions, follow that exactly
- Do not invent requirements — only enforce what the guidelines actually state

OFFICIAL GUIDELINE CONTENT:
${guidelineContent}

========================================================
Now generate the listing JSON, ensuring every field strictly follows the guidelines above.
========================================================`
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: fullPrompt }]
      })
    })

    if (!response.ok) {
      const err = await response.json()
      return { statusCode: response.status, body: JSON.stringify({ error: err.error?.message || 'API error' }) }
    }

    const data = await response.json()
    const text = data.content.map(i => i.text || '').join('')
    const clean = text.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI did not return valid JSON' }) }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.parse(jsonMatch[0]))
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}