import { useState } from 'react'
import { Trash2, Download, Upload, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'

function SavedListingCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const listing = entry.listing

  const copyAll = () => {
    const text = `MARKETPLACE: ${entry.marketplaceName}\n\nTITLE:\n${listing.title}\n\nSHORT DESCRIPTION:\n${listing.shortDescription}\n\nLONG DESCRIPTION:\n${listing.longDescription}\n\nFEATURES:\n${(listing.features || []).map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nTAGS:\n${(listing.tags || []).join(', ')}`
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="result-card" style={{ marginBottom: 10 }}>
      <div className="result-header" style={{ cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div className="result-header-left">
          <div className="mp-badge" style={{ background: entry.marketplaceColor || '#888', color: entry.marketplaceTextColor || '#fff' }}>
            {entry.marketplaceIcon || '??'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{entry.appName}</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 1 }}>
              {entry.marketplaceName} &middot; {new Date(entry.savedAt).toLocaleDateString()} {new Date(entry.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
        <div className="result-actions">
          <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); copyAll() }}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button className="btn btn-ghost btn-sm btn-danger" onClick={e => { e.stopPropagation(); onDelete(entry.id) }}>
            <Trash2 size={12} />
          </button>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </div>
      {expanded && (
        <div className="result-body">
          <div className="form-group">
            <label>App title</label>
            <input value={listing.title || ''} readOnly style={{ background: 'var(--bg)', cursor: 'default' }} />
          </div>
          <div className="form-group">
            <label>Short description</label>
            <textarea value={listing.shortDescription || ''} readOnly style={{ minHeight: 56, background: 'var(--bg)', cursor: 'default' }} />
          </div>
          <div className="form-group">
            <label>Long description</label>
            <textarea value={listing.longDescription || ''} readOnly style={{ minHeight: 140, background: 'var(--bg)', cursor: 'default' }} />
          </div>
          <div className="form-group">
            <label>Features</label>
            <textarea value={(listing.features || []).join('\n')} readOnly style={{ minHeight: 80, background: 'var(--bg)', cursor: 'default' }} />
          </div>
          <div className="form-group">
            <label>Tags</label>
            <input value={(listing.tags || []).join(', ')} readOnly style={{ background: 'var(--bg)', cursor: 'default' }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistoryPage({ history, marketplaces, onDelete, onExport, onImport }) {
  if (history.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">{'\u25F7'}</div>
          <h3>No saved versions yet</h3>
          <p>Generate listings and click "Save" on any result to archive it here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{history.length} saved listing{history.length !== 1 ? 's' : ''} &mdash; click to expand</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={onExport}>
            <Download size={12} /> Export all
          </button>
          <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
            <Upload size={12} /> Import
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={onImport} />
          </label>
        </div>
      </div>

      {[...history].reverse().map((entry) => (
        <SavedListingCard key={entry.id} entry={entry} onDelete={onDelete} />
      ))}
    </div>
  )
}