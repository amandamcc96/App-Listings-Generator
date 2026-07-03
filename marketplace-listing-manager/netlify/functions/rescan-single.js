const { getStore } = require("@netlify/blobs");

// Save-only: the browser has already extracted + merged guidelines from each URL.
// isMerge (Add URLs) = keep existing values, append new. Otherwise (Rescan) = replace.
// No AI call here, so this always returns fast (no timeout).

function mergeArrays(oldArr = [], newArr = []) {
  const seen = new Set((oldArr || []).map(s => String(s).trim().toLowerCase()))
  const merged = [...(oldArr || [])]
  for (const item of (newArr || [])) {
    const key = String(item).trim().toLowerCase()
    if (key && !seen.has(key)) { seen.add(key); merged.push(item) }
  }
  return merged
}

const NUM_FIELDS = ['maxTitle','minTitle','maxShortDesc','minShortDesc','maxDesc','minDesc','maxFeatures','minFeatures','maxFeatureLen','maxTags','minTags']

exports.handler = async function(event, context) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { id, guidelines, additionalUrls } = JSON.parse(event.body)
    if (!id || !guidelines) return { statusCode: 400, body: JSON.stringify({ error: 'id and guidelines are required' }) }

    const store = getStore({ name: "custom-marketplaces", siteID: process.env.SITE_ID, token: process.env.NETLIFY_TOKEN, consistency: "strong" })
    const list = await store.get("list", { type: "json" }) || []
    const mp = list.find(m => m.id === id)
    if (!mp) return { statusCode: 404, body: JSON.stringify({ error: 'Marketplace not found' }) }

    const isMerge = !!(additionalUrls && additionalUrls.length > 0)
    const prevG = mp.guidelines || {}
    const now = new Date().toISOString()
    const plainTextRule = 'Long description must be plain text only — no HTML, no markdown, no heading tags'
    // Dedupe URLs (case-insensitive, ignoring trailing slash) so re-adding the same page doesn't double it
    const normUrl = (u) => String(u).trim().replace(/\/+$/, '').toLowerCase()
    const allUrls = isMerge
      ? [...(mp.guidelineUrls || []), ...additionalUrls].filter((u, i, arr) => arr.findIndex(x => normUrl(x) === normUrl(u)) === i)
      : (mp.guidelineUrls || [])

    let g
    if (isMerge) {
      g = {
        tone: prevG.tone || guidelines.tone || '',
        featureRequirements: prevG.featureRequirements || guidelines.featureRequirements || '',
        iconSpec: prevG.iconSpec || guidelines.iconSpec || '',
        screenshotSpec: prevG.screenshotSpec || guidelines.screenshotSpec || '',
        videoSpec: prevG.videoSpec || guidelines.videoSpec || '',
        rules: mergeArrays(prevG.rules, [plainTextRule, ...(guidelines.rules || [])]),
        nextSteps: mergeArrays(prevG.nextSteps, guidelines.nextSteps),
        lastScanned: now
      }
      for (const f of NUM_FIELDS) {
        g[f] = (typeof prevG[f] === 'number' && prevG[f] > 0) ? prevG[f]
             : (typeof guidelines[f] === 'number' && guidelines[f] > 0) ? guidelines[f] : null
      }
    } else {
      g = {
        tone: guidelines.tone || prevG.tone || '',
        featureRequirements: guidelines.featureRequirements || prevG.featureRequirements || '',
        iconSpec: guidelines.iconSpec || '',
        screenshotSpec: guidelines.screenshotSpec || '',
        videoSpec: guidelines.videoSpec || '',
        rules: mergeArrays([plainTextRule], guidelines.rules),
        nextSteps: guidelines.nextSteps || [],
        lastScanned: now
      }
      for (const f of NUM_FIELDS) {
        g[f] = (typeof guidelines[f] === 'number' && guidelines[f] > 0) ? guidelines[f]
             : (typeof prevG[f] === 'number' && prevG[f] > 0) ? prevG[f] : null
      }
    }

    const updatedMp = { ...mp, guidelineUrls: allUrls, guidelines: g }
    const updatedList = list.map(m => m.id === id ? updatedMp : m)
    await store.setJSON("list", updatedList)

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedMp) }
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  }
}