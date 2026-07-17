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
      // A brand-new store has no "list" key yet — treat as empty
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
      const { id } = JSON.parse(event.body || '{}')
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id is required' }) }

      const list = await store.get("list", { type: "json" }) || []
      const updated = list.filter(m => m.id !== id)
      if (updated.length === list.length) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Marketplace not found' }) }
      }
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
  // PATCH — update specific fields on a marketplace by id
  if (event.httpMethod === 'PATCH') {
    try {
      const { id, ...fields } = JSON.parse(event.body || '{}')
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id is required' }) }

      const list = await store.get("list", { type: "json" }) || []
      const idx = list.findIndex(m => m.id === id)
      if (idx === -1) return { statusCode: 404, body: JSON.stringify({ error: 'Marketplace not found' }) }

      list[idx] = { ...list[idx], ...fields }
      await store.setJSON("list", list)
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(list[idx]) }
    } catch (err) {
      return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
}