const { getStore } = require("@netlify/blobs");

// Save-only: the browser has already extracted + merged guidelines from each URL.
// No AI call here, so this always returns fast (no timeout).

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { name, urls, guidelines } = JSON.parse(event.body)
    if (!name || !guidelines) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Name and guidelines are required' }) }
    }

    const plainTextRule = 'Long description must be plain text only — no HTML, no markdown, no heading tags'
    const rules = [plainTextRule, ...((guidelines.rules || []).filter(r => r && r.trim().toLowerCase() !== plainTextRule.toLowerCase()))]

    const finalGuidelines = { ...guidelines, rules, lastScanned: new Date().toISOString() }

    const id = 'custom_' + Date.now()
    const marketplace = {
      id,
      name,
      color: '#7c6af7',
      textColor: '#fff',
      icon: name.substring(0, 2).toUpperCase(),
      publishable: false,
      guidelineUrls: urls || [],
      guidelines: finalGuidelines
    }

    const store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })
    let existing
    try {
      existing = await store.get("list", { type: "json" }) || []
    } catch (blobErr) {
      existing = []
    }

    try {
      existing.push(marketplace)
      await store.setJSON("list", existing)
    } catch (blobErr) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save marketplace: ' + blobErr.message }) }
    }

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(marketplace) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}