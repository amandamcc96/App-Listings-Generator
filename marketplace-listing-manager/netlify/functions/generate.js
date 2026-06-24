async function fetchGuidelineContent(urls) {
  if (!urls || urls.length === 0) return ''

  const results = []
  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'CommercientListingManager/1.0' }
      })
      if (!resp.ok) continue
      const html = await resp.text()

      // Extract text content from HTML — strip tags and clean up
      let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/\s+/g, ' ')
        .trim()

      // Limit each page to ~3000 chars to stay within prompt limits
      if (text.length > 3000) {
        text = text.substring(0, 3000) + '...'
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

    // Fetch live guideline content if URLs are provided
    let guidelineContent = ''
    if (guidelineUrls && guidelineUrls.length > 0) {
      guidelineContent = await fetchGuidelineContent(guidelineUrls)
    }

    // Build the full prompt with live guidelines as context
    let fullPrompt = prompt
    if (guidelineContent) {
      fullPrompt = `${prompt}

IMPORTANT — LIVE MARKETPLACE GUIDELINES (fetched from official documentation):
The following is the actual current content from the marketplace's official guideline pages. This is the PRIMARY source of truth. If any rule below conflicts with the guidelines stated above, follow these live guidelines instead.

${guidelineContent}

Remember: follow ALL requirements from the official guidelines above. Generate the listing JSON now.`
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
        max_tokens: 2000,
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

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(JSON.parse(clean))
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}