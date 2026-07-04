// Generates one listing from the prompt built in the browser.
// The prompt already contains the full stored marketplace guidelines (limits, rules,
// tone, feature format), so no live URL fetching is needed — keeps this fast (no timeout).

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) }
  }

  try {
    const { prompt } = JSON.parse(event.body)
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required' }) }
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
        messages: [{ role: 'user', content: prompt }]
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