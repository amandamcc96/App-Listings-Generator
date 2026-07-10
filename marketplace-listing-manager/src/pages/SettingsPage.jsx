import { useState, useEffect } from 'react'
import { Trash2, RefreshCw, ExternalLink, Loader, Plus, X, BookOpen, Check } from 'lucide-react'
import { mergeGuidelineFragments, fetchPage, extractPage } from '../components/AddMarketplaceModal'

function ProductKnowledgeCard() {
  const [content, setContent] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/.netlify/functions/product-knowledge')
      .then(r => r.json())
      .then(kb => { setContent(kb.content || ''); setUpdatedAt(kb.updatedAt || null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setError('')
    try {
      const resp = await fetch('/.netlify/functions/product-knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: 'Save failed' }))
        throw new Error(err.error || 'Save failed')
      }
      const kb = await resp.json()
      setUpdatedAt(kb.updatedAt)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <BookOpen size={14} /> Product knowledge base
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, lineHeight: 1.6 }}>
        The factual source of truth for all generated listings. The AI will only state product facts (pricing, synced objects, setup, support, languages) that appear here — anything missing gets a <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>[CONFIRM: ...]</span> placeholder instead of being invented. Shared across all users.
      </p>
      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader size={13} style={{ animation: 'spin 0.65s linear infinite' }} /> Loading...
        </div>
      ) : (
        <>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={"Example structure:\n\nPRODUCT: Commercient SYNC\nWhat it does: ...\nSynced objects and directions: Accounts (ERP -> CRM), Invoices (ERP -> CRM), Orders (bidirectional), ...\nPricing: ...\nSetup summary: ...\nSupport: ...\nLanguages: ..."}
            style={{ minHeight: 220, fontFamily: 'var(--mono)', fontSize: 12, lineHeight: 1.6, width: '100%' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
            <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>
              {saved ? <Check size={12} /> : null}
              {saving ? 'Saving...' : saved ? 'Saved!' : 'Save knowledge base'}
            </button>
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {content.length.toLocaleString()} characters
              {updatedAt ? ` \u00B7 Last updated ${new Date(updatedAt).toLocaleDateString()} ${new Date(updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
            </span>
          </div>
          {error && (
            <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 12, marginTop: 10 }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Read + extract a list of URLs one page at a time, reporting progress. Returns merged guidelines.
async function scanUrls(name, urlList, onStatus) {
  const fragments = []
  for (let i = 0; i < urlList.length; i++) {
    if (onStatus) onStatus(`Reading page ${i + 1} of ${urlList.length}...`)
    const content = await fetchPage(urlList[i])
    if (!content) continue
    if (onStatus) onStatus(`Analyzing page ${i + 1} of ${urlList.length}...`)
    const frag = await extractPage(name, content)
    if (frag) fragments.push(frag)
  }
  return { merged: mergeGuidelineFragments(fragments), count: fragments.length }
}

function AddUrlModal({ marketplace, onClose, onSaved }) {
  const [urls, setUrls] = useState([''])
  const [scanning, setScanning] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')

  const addUrl = () => setUrls(u => [...u, ''])
  const removeUrl = (i) => setUrls(u => u.filter((_, idx) => idx !== i))
  const updateUrl = (i, val) => setUrls(u => u.map((v, idx) => idx === i ? val : v))

  const handleSave = async () => {
    const validUrls = urls.map(u => u.trim()).filter(u => u.startsWith('http'))
    if (validUrls.length === 0) { setError('Please add at least one valid URL.'); return }

    setError('')
    setScanning(true)

    try {
      const { merged, count } = await scanUrls(marketplace.name, validUrls, setStatus)
      if (count === 0) throw new Error('Could not read the provided URLs.')

      setStatus('Saving...')
      const resp = await fetch('/.netlify/functions/rescan-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: marketplace.id, additionalUrls: validUrls, guidelines: merged })
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
  const [rescanStatus, setRescanStatus] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [showAddUrls, setShowAddUrls] = useState(false)
  const lastScanned = marketplace.guidelines?.lastScanned

  const handleRescan = async () => {
    setRescanning(true)
    try {
      const guidelineUrls = marketplace.guidelineUrls || []
      const { merged } = await scanUrls(marketplace.name, guidelineUrls, setRescanStatus)

      setRescanStatus('Saving...')
      const resp = await fetch('/.netlify/functions/rescan-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: marketplace.id, guidelines: merged })
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
      setRescanStatus('')
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

        {rescanning && rescanStatus && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader size={11} style={{ animation: 'spin 0.65s linear infinite' }} /> {rescanStatus}
          </div>
        )}

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
              <span className="badge badge-purple" style={{ fontSize: 10 }}>Title: {marketplace.guidelines?.maxTitle || (marketplace.guidelines?.minTitle ? 'min ' + marketplace.guidelines.minTitle : '—')}</span>
              <span className="badge badge-purple" style={{ fontSize: 10 }}>Short: {marketplace.guidelines?.maxShortDesc || (marketplace.guidelines?.minShortDesc ? 'min ' + marketplace.guidelines.minShortDesc : '—')}</span>
              <span className="badge badge-purple" style={{ fontSize: 10 }}>Long: {marketplace.guidelines?.maxDesc || (marketplace.guidelines?.minDesc ? 'min ' + marketplace.guidelines.minDesc : '—')}</span>
              <span className="badge badge-purple" style={{ fontSize: 10 }}>Features: {marketplace.guidelines?.maxFeatures || (marketplace.guidelines?.minFeatures ? 'min ' + marketplace.guidelines.minFeatures : '—')}</span>
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
              Guidelines are automatically refreshed when they're more than 6 months old. You can also rescan manually or add more URLs to any marketplace.
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

      <ProductKnowledgeCard />

      <div className="card">
        <div className="card-title">Automatic guideline rescanning</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Marketplace guidelines are automatically refreshed in the background once they're more than <strong>6 months</strong> old, keeping listings compliant with the latest requirements. The "Last scanned" date on each marketplace shows when its guidelines were last updated.
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