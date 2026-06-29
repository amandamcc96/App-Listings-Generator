const { getStore } = require("@netlify/blobs");

async function fetchUrlContent(url) {
  try {
    const jinaUrl = `https://r.jina.ai/${url}`
    const resp = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/plain', 'User-Agent': 'CommercientListingManager/1.0' }
    })
    if (!resp.ok) return null
    let text = await resp.text()
    if (text.length > 4000) text = text.substring(0, 4000) + '...'
    return text.length > 100 ? text : null
  } catch (e) { return null }
}

exports.handler = async function(event, context) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { statusCode: 500 }

  try {
    const store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })
    const list = await store.get("list", { type: "json" }) || []
    if (list.length === 0) return { statusCode: 200, body: JSON.stringify({ message: 'No marketplaces to rescan' }) }

    const updated = []
    for (const mp of list) {
      const urls = mp.guidelineUrls || []
      if (urls.length === 0) { updated.push(mp); continue }

      const contents = []
      for (const url of urls) {
        const content = await fetchUrlContent(url)
        if (content) contents.push(`[Source: ${url}]\n${content}`)
      }
      if (contents.length === 0) { updated.push(mp); continue }

      const now = new Date().toISOString()
      const prompt = `You are analyzing app marketplace listing guidelines for "${mp.name}". Extract ALL listing requirements as structured JSON.

DOCUMENTATION:
${contents.join('\n\n---\n\n')}

Return ONLY valid JSON (no preamble, no fences):
{"maxTitle":50,"maxShortDesc":200,"maxDesc":1500,"maxFeatures":5,"maxFeatureLen":100,"maxTags":5,"tone":"","rules":[],"nextSteps":[],"lastScanned":"${now}"}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] })
      })

      if (!response.ok) { updated.push(mp); continue }

      const data = await response.json()
      const text = data.content.map(i => i.text || '').join('')
      const clean = text.replace(/```json|```/g, '').trim()
      const guidelines = JSON.parse(clean)
      updated.push({ ...mp, guidelines: { ...guidelines, rules: ['Long description must be plain text only — no HTML no markdown no heading tags', ...(guidelines.rules || [])] } })
    }

    await store.setJSON("list", updated)
    return { statusCode: 200, body: JSON.stringify({ message: `Rescanned ${updated.length} marketplaces` }) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}