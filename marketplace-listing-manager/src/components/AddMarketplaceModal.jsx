import { useState } from 'react'
import { X, Plus, Trash2, Loader } from 'lucide-react'

const NUM_FIELDS = ['maxTitle','minTitle','maxShortDesc','minShortDesc','maxDesc','minDesc','maxFeatures','minFeatures','maxFeatureLen','maxTags','minTags']
const STR_FIELDS = ['tone','featureRequirements','iconSpec','screenshotSpec','videoSpec']

// Merge per-URL guideline fragments into one object.
// Numbers: for maxima keep the smallest (most restrictive), for minima keep the largest (most restrictive).
// Strings: first non-empty wins. Arrays: deduped union.
export function mergeGuidelineFragments(fragments) {
  const out = { rules: [], nextSteps: [] }
  STR_FIELDS.forEach(f => { out[f] = '' })
  NUM_FIELDS.forEach(f => { out[f] = null })
  const seenRule = new Set(), seenStep = new Set()
  for (const g of fragments) {
    if (!g) continue
    for (const f of NUM_FIELDS) {
      const v = g[f]
      if (typeof v === 'number' && v > 0) {
        if (out[f] == null) out[f] = v
        else out[f] = f.startsWith('max') ? Math.min(out[f], v) : Math.max(out[f], v)
      }
    }
    for (const f of STR_FIELDS) { if (!out[f] && g[f]) out[f] = g[f] }
    for (const r of (g.rules || [])) { const k = String(r).trim().toLowerCase(); if (r && !seenRule.has(k)) { seenRule.add(k); out.rules.push(r) } }
    for (const s of (g.nextSteps || [])) { const k = String(s).trim().toLowerCase(); if (s && !seenStep.has(k)) { seenStep.add(k); out.nextSteps.push(s) } }
  }
  return out
}

// Fetch one page via Jina with a per-URL timeout so a slow page can't hang the whole scan
export async function fetchPage(url) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const resp = await fetch(`https://r.jina.ai/${url}`, { headers: { 'Accept': 'text/plain' }, signal: controller.signal })
    clearTimeout(timeout)
    if (!resp.ok) return null
    let text = await resp.text()
    if (text.length > 8000) text = text.substring(0, 8000) + '...'
    return text.length > 100 ? text : null
  } catch (e) { return null }
}

// Extract guidelines from a single page (small, fast serverless call)
export async function extractPage(name, content) {
  const resp = await fetch('/.netlify/functions/extract-guidelines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, content })
  })
  if (!resp.ok) return null
  const data = await resp.json().catch(() => null)
  return data ? data.guidelines : null
}

export default function AddMarketplaceModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [urls, setUrls] = useState([''])
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const addUrl = () => setUrls(u => [...u, ''])
  const removeUrl = (i) => setUrls(u => u.filter((_, idx) => idx !== i))
  const updateUrl = (i, val) => setUrls(u => u.map((v, idx) => idx === i ? val : v))

  const handleScan = async () => {
    const trimmedName = name.trim()
    const validUrls = urls.map(u => u.trim()).filter(u => u.startsWith('http'))
    if (!trimmedName) { setError('Please enter a marketplace name.'); return }
    if (validUrls.length === 0) { setError('Please add at least one valid URL.'); return }

    setError('')
    setScanning(true)

    try {
      // Process one URL at a time: fetch it, then extract from just that page. Each step is small and fast.
      const fragments = []
      for (let i = 0; i < validUrls.length; i++) {
        setStatus(`Reading page ${i + 1} of ${validUrls.length}...`)
        const content = await fetchPage(validUrls[i])
        if (!content) continue
        setStatus(`Analyzing page ${i + 1} of ${validUrls.length}...`)
        const frag = await extractPage(trimmedName, content)
        if (frag) fragments.push(frag)
      }

      if (fragments.length === 0) {
        throw new Error('Could not read any of the provided URLs. Make sure they are correct and publicly accessible.')
      }

      setStatus('Saving marketplace...')
      const merged = mergeGuidelineFragments(fragments)
      const resp = await fetch('/.netlify/functions/scan-guidelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, urls: validUrls, guidelines: merged })
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Server error' }))
        throw new Error(err.error || 'Save failed')
      }

      const marketplace = await resp.json()
      onSave(marketplace)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setScanning(false)
      setStatus('')
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Add marketplace</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={15} /></button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
          Enter the marketplace name and paste URLs to its listing guidelines. The AI will read all pages and extract every rule, character limit, and image requirement.
        </p>
        <div className="form-group">
          <label>Marketplace name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HubSpot" />
        </div>
        <div className="form-group">
          <label>Guideline URLs — add as many as needed</label>
          {urls.map((url, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={url} onChange={e => updateUrl(i, e.target.value)} placeholder="https://docs.example.com/listing-guidelines" style={{ flex: 1 }} />
              {urls.length > 1 && (
                <button className="btn btn-ghost" onClick={() => removeUrl(i)} style={{ padding: '4px 6px', color: 'var(--red)' }}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={addUrl} style={{ marginTop: 2 }}>
            <Plus size={12} /> Add another URL
          </button>
        </div>
        {error && (
          <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 12 }}>
            {error}
          </div>
        )}
        {scanning && status && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader size={13} style={{ animation: 'spin 0.65s linear infinite' }} /> {status}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={scanning}>Cancel</button>
          <button className="btn btn-primary" onClick={handleScan} disabled={scanning}>
            {scanning ? 'Scanning...' : 'Scan & add marketplace'}
          </button>
        </div>
      </div>
    </div>
  )
}