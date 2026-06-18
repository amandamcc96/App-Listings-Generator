import { useState } from 'react'
import { X } from 'lucide-react'

export default function AddMarketplaceModal({ onSave, onClose }) {
  const [form, setForm] = useState({
    name: '', maxTitle: 50, maxShortDesc: 200, maxDesc: 2000,
    maxFeatures: 6, maxTags: 8, rules: '', tone: ''
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = () => {
    if (!form.name.trim()) { alert('Please enter a marketplace name.'); return }
    const rules = form.rules.split('\n').map(r => r.trim()).filter(Boolean)
    const id = 'custom_' + Date.now()
    onSave({
      id, name: form.name.trim(),
      color: '#7c6af7', textColor: '#fff',
      icon: form.name.trim().substring(0, 2).toUpperCase(),
      publishable: false,
      guidelines: {
        maxTitle: parseInt(form.maxTitle) || 50,
        maxShortDesc: parseInt(form.maxShortDesc) || 200,
        maxDesc: parseInt(form.maxDesc) || 2000,
        maxFeatures: parseInt(form.maxFeatures) || 6,
        maxFeatureLen: 100,
        maxTags: parseInt(form.maxTags) || 8,
        rules: rules.length ? rules : ['Follow standard app marketplace guidelines'],
        tone: form.tone || 'Professional, clear'
      }
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>Add custom marketplace</h2>
          <button className="btn-ghost btn" onClick={onClose}><X size={15} /></button>
        </div>

        <div className="form-group">
          <label>Marketplace name</label>
          <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Pipedrive Marketplace" />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Title character limit</label>
            <input type="number" value={form.maxTitle} onChange={e => set('maxTitle', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Short description limit</label>
            <input type="number" value={form.maxShortDesc} onChange={e => set('maxShortDesc', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Long description limit</label>
            <input type="number" value={form.maxDesc} onChange={e => set('maxDesc', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Max features</label>
            <input type="number" value={form.maxFeatures} onChange={e => set('maxFeatures', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Writing tone</label>
          <input value={form.tone} onChange={e => set('tone', e.target.value)} placeholder="e.g. Professional, benefit-focused" />
        </div>

        <div className="form-group">
          <label>Listing rules &amp; restrictions (one per line)</label>
          <textarea
            value={form.rules}
            onChange={e => set('rules', e.target.value)}
            placeholder={"No promotional language\nMust include pricing info\nFeatures must start with a verb"}
            style={{ minHeight: 100 }}
          />
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Add marketplace</button>
        </div>
      </div>
    </div>
  )
}
