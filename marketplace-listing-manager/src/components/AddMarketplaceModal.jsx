import { useState } from 'react'
import { X, Plus, Trash2, Loader } from 'lucide-react'

export default function AddMarketplaceModal({ onSave, onClose }) {
  const [name, setName] = useState('')
  const [urls, setUrls] = useState([''])
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const addUrl = () => setUrls(u => [...u, ''])
  const removeUrl = (i) => setUrls(u => u.filter((_, idx) => idx !== i))
  const updateUrl = (i, val) => setUrls(u => u.map((v, idx) => idx === i ? val : v))

  const fetchUrlContent = async (url) => {
    try {
      const jinaUrl = `https://r.jina.ai/${url}`
      const resp = await fetch(jinaUrl, { headers: { 'Accept': 'text/plain' } })
      if (!resp.ok) return null
      let text = await resp.text()
      // Keep to 4000 chars per URL so multiple URLs don't exceed AI limits
      if (text.length > 4000) text = text.substring(0, 4000) + '...'
      return text.length > 100 ? text : null
    } catch (e) { return null }
  }

  const handleScan = async () => {
    const trimmedName = name.trim()
    const validUrls = urls.map(u => u.trim()).filter(u => u.startsWith('http'))
    if (!trimmedName) { setError('Please enter a marketplace name.'); return }
    if (validUrls.length === 0) { setError('Please add at least one valid URL.'); return }

    setError('')
    setScanning(true)

    try {
      // Fetch all URLs in the browser in parallel (faster, no server timeout)
      setStatus(`Fetching ${validUrls.length} guideline page${validUrls.length > 1 ? 's' : ''}...`)
      const contentResults = await Promise.all(validUrls.map(fetchUrlContent))
      const contents = contentResults
        .map((content, i) => content ? `[Source: ${validUrls[i]}]\n${content}` : null)
        .filter(Boolean)

      if (contents.length === 0) {
        throw new Error('Could not fetch content from any of the provided URLs. Make sure they are correct and publicly accessible.')
      }

      setStatus('Analyzing guidelines with AI...')
      const resp = await fetch('/.netlify/functions/scan-guidelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          urls: validUrls,
          fetchedContent: contents.join('\n\n---\n\n')
        })
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Server error' }))
        throw new Error(err.error || 'Scan failed')
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