const { getStore } = require("@netlify/blobs");

// Stores the shared product knowledge block used as the factual source of truth
// for all generated listings. GET returns it; POST saves it.

exports.handler = async function(event, context) {
  const store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })

  if (event.httpMethod === 'GET') {
    try {
      const kb = await store.get("product-knowledge", { type: "json" })
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kb || { content: '', updatedAt: null })
      }
    } catch (err) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '', updatedAt: null })
      }
    }
  }

  if (event.httpMethod === 'POST') {
    try {
      const { content } = JSON.parse(event.body || '{}')
      if (typeof content !== 'string') {
        return { statusCode: 400, body: JSON.stringify({ error: 'content (string) is required' }) }
      }
      if (content.length > 100000) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Knowledge base is too large (max 100,000 characters)' }) }
      }
      const kb = { content, updatedAt: new Date().toISOString() }
      await store.setJSON("product-knowledge", kb)
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(kb) }
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
}
