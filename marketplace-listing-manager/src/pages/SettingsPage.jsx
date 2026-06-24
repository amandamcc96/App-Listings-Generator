import { useState } from 'react'
import { Trash2, RefreshCw, ExternalLink, Loader } from 'lucide-react'

export default function SettingsPage({ customMarketplaces, onDeleteCustom, onClearHistory, onRescanMarketplace }) {

  return (
    <div className="page">
      {customMarketplaces.length > 0 && (
        <div className="card">
          <div className="card-title">Marketplaces</div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
            These marketplaces were added via guideline URL scanning. Guidelines are automatically rescanned every 6 months (January and July). You can also rescan manually.
          </p>
          {customMarketplaces.map(mp => (
            <MarketplaceRow key={mp.id} marketplace={mp} onDelete={onDeleteCustom} onRescan={onRescanMarketplace} />
          ))}
        </div>
      )}

      {customMarketplaces.length === 0 && (
        <div className="card">
          <div className="card-title">Marketplaces</div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            No marketplaces added yet. Click <strong>Add marketplace</strong> in the sidebar to add one using guideline URLs.
          </p>
        </div>
      )}

      <div className="card">
        <div className="card-title">Automatic guideline rescanning</div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          All marketplace guidelines are automatically rescanned on <strong>January 1st</strong> and <strong>July 1st</strong> each year. This ensures your generated listings always follow the most current requirements. No action needed — it runs automatically.
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

function MarketplaceRow({ marketplace, onDelete, onRescan }) {
  const [rescanning, setRescanning] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const lastScanned = marketplace.guidelines?.lastScanned

  const handleRescan = async () => {
    setRescanning(true)
    try {
      const resp = await fetch('/.netlify/functions/rescan-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: marketplace.id })
      })
      if (!resp.ok) {
        const err = await resp.json()
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
              {' · '}{(marketplace.guidelineUrls || []).length} guideline URL{(marketplace.guidelineUrls || []).length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => !e)} style={{ fontSize: 11 }}>
            {expanded ? 'Hide details' : 'Show details'}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleRescan} disabled={rescanning}>
            {rescanning ? <Loader size={12} style={{ animation: 'spin 0.65s linear infinite' }} /> : <RefreshCw size={12} />}
            {rescanning ? 'Scanning...' : 'Rescan'}
          </button>
          <button className="btn btn-ghost btn-sm btn-danger" onClick={() => { if (window.confirm(`Delete ${marketplace.name}?`)) onDeleteCustom(marketplace.id) }}>
            <Trash2 size={12} />
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

          {marketplace.guidelines?.rules && (
            <>
              <div style={{ fontWeight: 500, color: 'var(--text-muted)', marginTop: 10, marginBottom: 6 }}>EXTRACTED RULES ({marketplace.guidelines.rules.length})</div>
              <ul style={{ paddingLeft: 16 }}>
                {marketplace.guidelines.rules.map((r, i) => (
                  <li key={i} style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 11 }}>{r}</li>
                ))}
              </ul>
            </>
          )}

          {marketplace.guidelines?.nextSteps && (
            <>
              <div style={{ fontWeight: 500, color: 'var(--text-muted)', marginTop: 10, marginBottom: 6 }}>IMAGE / SUBMISSION REQUIREMENTS ({marketplace.guidelines.nextSteps.length})</div>
              <ul style={{ paddingLeft: 16 }}>
                {marketplace.guidelines.nextSteps.map((s, i) => (
                  <li key={i} style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: 11 }}>{s}</li>
                ))}
              </ul>
            </>
          )}

          <div style={{ fontWeight: 500, color: 'var(--text-muted)', marginTop: 10, marginBottom: 4 }}>CHARACTER LIMITS</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-purple" style={{ fontSize: 10 }}>Title: {marketplace.guidelines?.maxTitle || '?'}</span>
            <span className="badge badge-purple" style={{ fontSize: 10 }}>Short: {marketplace.guidelines?.maxShortDesc || '?'}</span>
            <span className="badge badge-purple" style={{ fontSize: 10 }}>Long: {marketplace.guidelines?.maxDesc || '?'}</span>
            <span className="badge badge-purple" style={{ fontSize: 10 }}>Features: {marketplace.guidelines?.maxFeatures || '?'}</span>
          </div>
        </div>
      )}
    </div>
  )
}