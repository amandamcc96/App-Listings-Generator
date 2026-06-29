import { useState } from 'react'
import { Trash2, RefreshCw, ExternalLink, Loader, Plus, X } from 'lucide-react'

function AddUrlModal({ marketplace, onClose, onSaved }) {
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
      if (text.length > 4000) text = text.substring(0, 4000) + '...'
      return text.length > 100 ? text : null
    } catch (e) { return null }
  }

  const handleSave = async () => {
    const validUrls = urls.map(u => u.trim()).filter(u => u.startsWith('http'))
    if (validUrls.length === 0) { setError('Please add at least one valid URL.'); return }

    setError('')
    setScanning(true)

    try {
      setStatus('Fetching guideline pages...')
      const contentResults = await Promise.all(validUrls.map(fetchUrlContent))
      const allUrls = [...(marketplace.guidelineUrls || []), ...validUrls]
      const contents = contentResults
        .map((content, i) => content ? `[Source: ${validUrls[i]}]\n${content}` : null)
        .filter(Boolean)

      if (contents.length === 0) throw new Error('Could not fetch content from the provided URLs.')

      setStatus('Rescanning all guidelines with AI...')
      const resp = await fetch('/.netlify/functions/rescan-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: marketplace.id, additionalUrls: validUrls, additionalContent: contents.join('\n\n---\n\n') })
      })

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Server error' }))
        throw new Error(err.error || 'Failed to update')
      }

      const updated = await resp.json()
      onSaved(updated)
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
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Add URLs to {marketplace.name}</h2>
          <button className="btn btn-ghost" onClick={onClose}><X size={15} /></button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14, lineHeight: 1.6 }}>
          Add more guideline URLs. The AI will read them and merge them with the existing guidelines.
        </p>
        <div className="form-group">
          <label>New guideline URLs</label>
          {urls.map((url, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={url} onChange={e => updateUrl(i, e.target.value)} placeholder="https://docs.example.com/new-guidelines" style={{ flex: 1 }} />
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
        {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 12 }}>{error}</div>}
        {scanning && status && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader size={13} style={{ animation: 'spin 0.65s linear infinite' }} /> {status}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={scanning}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={scanning}>
            {scanning ? 'Updating...' : 'Add & rescan'}
          </button>
        </div>
      </div>
    </div>
  )
}

function MarketplaceRow({ marketplace, onDelete, onRescan, onUrlsAdded }) {
  const [rescanning, setRescanning] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [showAddUrls, setShowAddUrls] = useState(false)
  const lastScanned = marketplace.guidelines?.lastScanned

  const handleRescan = async () => {
    setRescanning(true)
    try {
      // Fetch all existing URLs in browser first
      const contents = []
      for (const url of (marketplace.guidelineUrls || [])) {
        try {
          const resp = await fetch(`https://r.jina.ai/${url}`, { headers: { 'Accept': 'text/plain' } })
          if (resp.ok) {
            let text = await resp.text()
            if (text.length > 4000) text = text.substring(0, 4000) + '...'
            if (text.length > 100) contents.push(`[Source: ${url}]\n${text}`)
          }
        } catch (e) {}
      }

      const resp = await fetch('/.netlify/functions/rescan-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: marketplace.id, fetchedContent: contents.join('\n\n---\n\n') })
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Unknown error' }))
        alert('Rescan failed: ' + (err.error || 'Unknown error'))
      } else {
        const updated = await resp.json()
        if (onRescan) onRescan(updated)
      }
    } catch (e) {
      alert('Rescan failed: ' + e.message)
    } finally {
      setRescanning(false)
    }
  }

  return (
    <>
      <div style={{ borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div className="mp-badge" style={{ background: marketplace.color, color: marketplace.textColor, width: 30, height: 30, borderRadius: 7, fontSize: 11 }}>
              {marketplace.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{marketplace.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                {lastScanned ? `Last scanned: ${new Date(lastScanned).toLocaleDateString()}` : 'Not scanned yet'}
                {' · '}{(marketplace.guidelineUrls || []).length} URL{(marketplace.guidelineUrls || []).length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => !e)} style={{ fontSize: 11 }}>
              {expanded ? 'Hide' : 'Details'}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setShowAddUrls(true)}>
              <Plus size={12} /> Add URLs
            </button>
            <button className="btn btn-secondary btn-sm" onClick={handleRescan} disabled={rescanning}>
              {rescanning ? <Loader size={12} style={{ animation: 'spin 0.65s linear infinite' }} /> : <RefreshCw size={12} />}
              {rescanning ? 'Scanning...' : 'Rescan'}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => { if (window.confirm(`Delete ${marketplace.name}?`)) onDelete(marketplace.id) }}>
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius)', fontSize: 12 }}>
            <div style={{ fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6 }}>GUIDELINE URLS</div>
            {(marketplace.guidelineUrls || []).map((url, i) => (
              <div key={i} style={{ marginBottom: 4 }}>
                <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <ExternalLink size={10} /> {url}
                </a>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              <span className="badge badge-purple" style={{ fontSize: 10 }}>Title: {marketplace.guidelines?.maxTitle || '?'}</span>
              <span className="badge badge-purple" style={{ fontSize: 10 }}>Short: {marketplace.guidelines?.maxShortDesc || '?'}</span>
              <span className="badge badge-purple" style={{ fontSize: 10 }}>Long: {marketplace.guidelines?.maxDesc || '?'}</span>
              <span className="badge badge-purple" style={{ fontSize: 10 }}>Features: {marketplace.guidelines?.maxFeatures || '?'}</span>
            </div>
            {marketplace.guidelines?.rules && (
              <>
                <div style={{ fontWeight: 500, color: 'var(--text-muted)', marginTop: 10, marginBottom: 6 }}>RULES ({marketplace.guidelines.rules.length})</div>
                <ul style={{ paddingLeft: 16 }}>
                  {marketplace.guidelines.rules.map((r, i) => <li key={i} style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 11 }}>{r}</li>)}
                </ul>
              </>
            )}
            {marketplace.guidelines?.nextSteps && (
              <>
                <div style={{ fontWeight: 500, color: 'var(--text-muted)', marginTop: 10, marginBottom: 6 }}>IMAGE / SUBMISSION REQUIREMENTS ({marketplace.guidelines.nextSteps.length})</div>
                <ul style={{ paddingLeft: 16 }}>
                  {marketplace.guidelines.nextSteps.map((s, i) => <li key={i} style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 11 }}>{s}</li>)}
                </ul>
              </>
            )}
          </div>
        )}
      </div>

      {showAddUrls && (
        <AddUrlModal
          marketplace={marketplace}
          onClose={() => setShowAddUrls(false)}
          onSaved={(updated) => { onUrlsAdded(updated); setShowAddUrls(false) }}
        />
      )}
    </>
  )
}

export default function SettingsPage({ customMarketplaces, onDeleteCustom, onClearHistory, onRescanMarketplace }) {
  return (
    <div className="page">
      <div className="card">
        <div className="card-title">Marketplaces</div>
        {customMarketplaces.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            No marketplaces added yet. Click <strong>Add marketplace</strong> in the sidebar to add one using guideline URLs.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Guidelines are automatically rescanned every 6 months (January and July). You can also rescan manually or add more URLs to any marketplace.
            </p>
            {customMarketplaces.map(mp => (
              <MarketplaceRow
                key={mp.id}
                marketplace={mp}
                onDelete={onDeleteCustom}
                onRescan={onRescanMarketplace}
                onUrlsAdded={onRescanMarketplace}
              />
            ))}
          </>
        )}
      </div>

      <div className="card">
        <div className="card-title">Automatic guideline rescanning</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          All marketplace guidelines are automatically rescanned on <strong>January 1st</strong> and <strong>July 1st</strong> each year to keep listings compliant with the latest requirements.
        </p>
      </div>

      <div className="card">
        <div className="card-title">Data management</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Version history is stored in your browser's local storage.
        </p>
        <button className="btn btn-danger" onClick={() => { if (window.confirm('Clear all saved version history?')) onClearHistory() }}>
          <Trash2 size={13} /> Clear version history
        </button>
      </div>
    </div>
  )
}