import { useState } from 'react'
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, AlertTriangle, ExternalLink, Save } from 'lucide-react'
import { generateListing } from '../utils/api'

function LimitPill({ label, current, max }) {
  const pct = current / max
  const cls = pct > 1 ? 'badge-red' : pct > 0.85 ? 'badge-amber' : 'badge-green'
  return (
    <span className={`limit-pill badge ${cls}`}>
      {label}: {current}/{max}
    </span>
  )
}

function ResultCard({ marketplace, result, onSaveVersion }) {
  const [expanded, setExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [localResult, setLocalResult] = useState(result)

  const set = (k, v) => setLocalResult(r => ({ ...r, [k]: v }))

  const copyAll = () => {
    const text = [
      `MARKETPLACE: ${marketplace.name}`,
      `\nTITLE:\n${localResult.title}`,
      `\nSHORT DESCRIPTION:\n${localResult.shortDescription}`,
      `\nLONG DESCRIPTION:\n${localResult.longDescription}`,
      `\nFEATURES:\n${(localResult.features || []).map((f, i) => `${i + 1}. ${f}`).join('\n')}`,
      `\nTAGS:\n${(localResult.tags || []).join(', ')}`
    ].join('')
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const g = marketplace.guidelines

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-header-left">
          <div className="mp-badge" style={{ background: marketplace.color, color: marketplace.textColor }}>
            {marketplace.icon}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{marketplace.name}</div>
            {marketplace.publishable && (
              <span className="badge badge-green" style={{ fontSize: 10 }}>Direct publish available</span>
            )}
          </div>
        </div>
        <div className="result-actions">
          <button className="btn btn-ghost btn-sm" onClick={copyAll}>
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy all'}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => !e)}>
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="result-body">
          <div className="limit-bar">
            <LimitPill label="Title" current={(localResult.title || '').length} max={g.maxTitle} />
            <LimitPill label="Short" current={(localResult.shortDescription || '').length} max={g.maxShortDesc} />
            <LimitPill label="Long" current={(localResult.longDescription || '').length} max={g.maxDesc} />
          </div>

          <div className="form-group">
            <label>App title</label>
            <input value={localResult.title || ''} onChange={e => set('title', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Short description</label>
            <textarea value={localResult.shortDescription || ''} onChange={e => set('shortDescription', e.target.value)} style={{ minHeight: 60 }} />
          </div>
          <div className="form-group">
            <label>Long description</label>
            <textarea value={localResult.longDescription || ''} onChange={e => set('longDescription', e.target.value)} style={{ minHeight: 140 }} />
          </div>
          <div className="form-group">
            <label>Features (one per line)</label>
            <textarea
              value={(localResult.features || []).join('\n')}
              onChange={e => set('features', e.target.value.split('\n'))}
              style={{ minHeight: 80 }}
            />
          </div>
          <div className="form-group">
            <label>Tags</label>
            <input
              value={(localResult.tags || []).join(', ')}
              onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()))}
            />
          </div>

          {localResult.complianceNotes && localResult.complianceNotes.length > 0 && (
            <div className="compliance-notes">
              <p><AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />Compliance review notes</p>
              <ul>{localResult.complianceNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => onSaveVersion(marketplace.id, localResult)}>
              <Save size={12} /> Save version
            </button>
            {marketplace.publishable && marketplace.publishDocs && (
              <a href={marketplace.publishDocs} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
                <ExternalLink size={12} /> View publish docs
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function GeneratePage({ marketplaces, onSaveVersion }) {
  const [tab, setTab] = useState('input')
  const [form, setForm] = useState({
    name: '', version: '', erp: '', crm: '',
    description: '', features: '', audience: '', pricing: '', additionalContext: ''
  })
  const [selected, setSelected] = useState(new Set(['hubspot', 'shopify', 'salesforce']))
  const [results, setResults] = useState({})
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const toggleMp = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const generate = async () => {
    if (!form.name.trim() || !form.description.trim()) {
      alert('Please fill in at least the app name and description.')
      return
    }
    if (selected.size === 0) { alert('Select at least one marketplace.'); return }

    setGenerating(true)
    setTab('output')
    const newResults = {}
    const mps = marketplaces.filter(m => selected.has(m.id))

    for (const mp of mps) {
      setProgress(`Generating for ${mp.name}…`)
      try {
        newResults[mp.id] = await generateListing(form, mp)
      } catch (e) {
        newResults[mp.id] = { error: true, message: e.message }
      }
    }

    setResults(newResults)
    setGenerating(false)
    setProgress('')
  }

  const resultCount = Object.keys(results).length

  return (
    <div className="page">
      <div className="tabs">
        <button className={`tab ${tab === 'input' ? 'active' : ''}`} onClick={() => setTab('input')}>
          App details
        </button>
        <button className={`tab ${tab === 'output' ? 'active' : ''}`} onClick={() => setTab('output')}>
          Generated listings {resultCount > 0 ? `(${resultCount})` : ''}
        </button>
      </div>

      {tab === 'input' && (
        <>
          <div className="card">
            <div className="card-title">Integration app details</div>
            <div className="form-grid">
              <div className="form-group">
                <label>App / integration name</label>
                <input value={form.name} onChange={e => setF('name', e.target.value)} placeholder="e.g. ERP Sync for HubSpot" />
              </div>
              <div className="form-group">
                <label>Version</label>
                <input value={form.version} onChange={e => setF('version', e.target.value)} placeholder="e.g. 2.1" />
              </div>
              <div className="form-group">
                <label>ERP system</label>
                <input value={form.erp} onChange={e => setF('erp', e.target.value)} placeholder="e.g. SAP Business One, Sage 300" />
              </div>
              <div className="form-group">
                <label>CRM / platform connected</label>
                <input value={form.crm} onChange={e => setF('crm', e.target.value)} placeholder="e.g. HubSpot, Salesforce" />
              </div>
            </div>
            <div className="form-group">
              <label>What does this integration do?</label>
              <textarea
                value={form.description}
                onChange={e => setF('description', e.target.value)}
                placeholder="e.g. Syncs customer accounts, orders, invoices and inventory between SAP and HubSpot in real time. Eliminates manual data entry for sales teams."
                style={{ minHeight: 80 }}
              />
            </div>
            <div className="form-group">
              <label>Key features (one per line)</label>
              <textarea
                value={form.features}
                onChange={e => setF('features', e.target.value)}
                placeholder={"Real-time bidirectional sync\nOrder and invoice sync\nInventory level updates\nCustomer account mapping\nError logging and alerts"}
              />
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label>Target audience</label>
                <input value={form.audience} onChange={e => setF('audience', e.target.value)} placeholder="e.g. Mid-market manufacturers" />
              </div>
              <div className="form-group">
                <label>Pricing model</label>
                <input value={form.pricing} onChange={e => setF('pricing', e.target.value)} placeholder="e.g. From $99/month, 14-day free trial" />
              </div>
            </div>
            <div className="form-group">
              <label>Additional context for AI (optional)</label>
              <textarea
                value={form.additionalContext}
                onChange={e => setF('additionalContext', e.target.value)}
                placeholder="Any specific messaging, recent updates, awards, certifications, or notes for the AI to incorporate…"
                style={{ minHeight: 56 }}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-title">Target marketplaces</div>
            <div className="chip-list">
              {marketplaces.map(mp => (
                <div key={mp.id} className={`chip ${selected.has(mp.id) ? 'selected' : ''}`} onClick={() => toggleMp(mp.id)}>
                  <span className="chip-dot" style={{ background: mp.color }} />
                  {mp.name}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>
              Each listing will follow that marketplace's character limits and content rules automatically.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              <Sparkles size={14} />
              {generating ? 'Generating…' : `Generate ${selected.size} listing${selected.size !== 1 ? 's' : ''}`}
            </button>
          </div>
        </>
      )}

      {tab === 'output' && (
        <>
          {generating && (
            <div className="loading-row">
              <div className="spinner" />
              {progress}
            </div>
          )}
          {!generating && resultCount === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">✦</div>
              <h3>No listings generated yet</h3>
              <p>Fill in your app details and click Generate.</p>
            </div>
          )}
          {marketplaces.filter(m => results[m.id]).map(mp => (
            results[mp.id]?.error
              ? (
                <div key={mp.id} className="result-card" style={{ padding: 16 }}>
                  <span style={{ color: 'var(--red)', fontSize: 13 }}>
                    {mp.name}: Generation failed — {results[mp.id].message || 'please retry'}
                  </span>
                </div>
              )
              : (
                <ResultCard
                  key={mp.id}
                  marketplace={mp}
                  result={results[mp.id]}
                  onSaveVersion={onSaveVersion}
                />
              )
          ))}
        </>
      )}
    </div>
  )
}
