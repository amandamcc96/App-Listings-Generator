// Generates listing content from a prompt built in the browser.
// The client splits work into small calls (core listing, then section batches),
// so each invocation stays well under the 10-second function timeout.

// Repair JSON that was cut off mid-stream by the max_tokens cap:
// close any unterminated string, strip a dangling comma/colon, and close open brackets.
function repairTruncatedJson(s) {
  let str = s
  let inStr = false
  const stack = []
  for (let i = 0; i < str.length; i++) {
    const c = str[i]
    if (inStr) {
      if (c === '\\') i++
      else if (c === '"') inStr = false
    } else {
      if (c === '"') inStr = true
      else if (c === '{' || c === '[') stack.push(c)
      else if (c === '}' || c === ']') stack.pop()
    }
  }
  if (inStr) str += '"'
  str = str.replace(/[,\s]*$/, '')
  if (/:$/.test(str.trim())) str += ' null'
  while (stack.length) {
    const open = stack.pop()
    str += open === '{' ? '}' : ']'
  }
  return str
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
    const { prompt, maxTokens } = JSON.parse(event.body)
    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Prompt is required' }) }
    }

    // Bound output size server-side; smaller outputs = faster responses = no timeouts
    const tokens = Math.min(Math.max(parseInt(maxTokens) || 1000, 200), 1500)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: tokens,
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
    const jsonMatch = clean.match(/\{[\s\S]*\}|\{[\s\S]*$/)
    if (!jsonMatch) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AI did not return valid JSON' }) }
    }

    let parsed
    let wasRepaired = false
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch (parseErr) {
      // Truncated mid-stream — repair and retry the parse
      try {
        parsed = JSON.parse(repairTruncatedJson(jsonMatch[0]))
        wasRepaired = true
      } catch (repairErr) {
        return { statusCode: 500, body: JSON.stringify({ error: 'AI returned malformed JSON: ' + parseErr.message }) }
      }
    }

    if (wasRepaired || data.stop_reason === 'max_tokens') {
      if (Array.isArray(parsed.complianceNotes)) {
        parsed.complianceNotes.push('Response was cut off and automatically recovered — review this listing for missing content.')
      } else if (parsed && typeof parsed === 'object' && !Array.isArray(parsed.sections)) {
        parsed.complianceNotes = ['Response was cut off and automatically recovered — review this listing for missing content.']
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}
