import { Trash2, Download, Upload } from 'lucide-react'

export default function HistoryPage({ history, onDelete, onExport, onImport }) {
  if (history.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">◷</div>
          <h3>No saved versions yet</h3>
          <p>Generate listings and click "Save version" on any result to archive it here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{history.length} saved version{history.length !== 1 ? 's' : ''}</p>
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
        <div className="history-card" key={entry.id}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{entry.appName}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
              {entry.marketplaceName} · v{entry.version || '—'} · {new Date(entry.savedAt).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.listing.title}
            </div>
            {entry.listing.shortDescription && (
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.listing.shortDescription}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button className="btn btn-ghost btn-sm btn-danger" onClick={() => onDelete(entry.id)}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
