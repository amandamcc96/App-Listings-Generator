import { useState } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'

export default function SettingsPage({ customMarketplaces, onDeleteCustom, onClearHistory }) {
  const [showKey, setShowKey] = useState(false)
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  return (
    <div className="page">
      <div className="card">
        <div className="card-title">API configuration</div>
        <div className="form-group">
          <label>Anthropic API key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey ? '••••••••••••••••••••••••' : 'Not configured'}
              readOnly
              style={{ flex: 1, color: apiKey ? 'var(--green)' : 'var(--red)' }}
            />
            <button className="btn btn-ghost" onClick={() => setShowKey(s => !s)}>
              {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>
            Set via <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: 3 }}>VITE_ANTHROPIC_API_KEY</code> in your <code style={{ fontFamily: 'var(--mono)', background: 'var(--bg-surface)', padding: '1px 5px', borderRadius: 3 }}>.env</code> file or in Netlify environment variables.
          </p>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text)' }}>Netlify setup:</strong> Go to Site settings → Environment variables → Add variable<br />
          Key: <code style={{ fontFamily: 'var(--mono)' }}>VITE_ANTHROPIC_API_KEY</code> &nbsp;|&nbsp; Value: your Anthropic API key<br />
          Then trigger a new deploy for changes to take effect.
        </div>
      </div>

      {customMarketplaces.length > 0 && (
        <div className="card">
          <div className="card-title">Custom marketplaces</div>
          {customMarketplaces.map(mp => (
            <div key={mp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="mp-badge" style={{ background: mp.color, color: mp.textColor, width: 28, height: 28, borderRadius: 6, fontSize: 10 }}>
                  {mp.icon}
                </div>
                <span style={{ fontSize: 13 }}>{mp.name}</span>
              </div>
              <button className="btn btn-ghost btn-sm btn-danger" onClick={() => onDeleteCustom(mp.id)}>
                <Trash2 size={12} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-title">Data management</div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          Version history and custom marketplace data are stored in your browser's local storage.
        </p>
        <button className="btn btn-danger" onClick={() => { if (window.confirm('Clear all saved version history?')) onClearHistory() }}>
          <Trash2 size={13} /> Clear version history
        </button>
      </div>
    </div>
  )
}
