const { getStore } = require("@netlify/blobs");

exports.handler = async function(event, context) {
  const store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })

  // GET — return all custom marketplaces
  if (event.httpMethod === 'GET') {
    try {
      const list = await store.get("list", { type: "json" }) || []
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(list)
      }
    } catch (err) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([])
      }
    }
  }

  // DELETE — remove a marketplace by id
  if (event.httpMethod === 'DELETE') {
    try {
      const { id } = JSON.parse(event.body)
      const list = await store.get("list", { type: "json" }) || []
      const updated = list.filter(m => m.id !== id)
      await store.setJSON("list", updated)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
}