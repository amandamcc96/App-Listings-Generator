import { useState } from 'react'
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, AlertTriangle, Save, Image, CheckCircle, Trash2 } from 'lucide-react'

const ERPS = ["AFAS Software","Abas","AccountsIQ","Acumatica","Agility ERP","Applied Epic","Aptean Apparel ERP Full Circle Edition","Aptean Discrete Manufacturing ERP Made2Manage Edition","Aptean Distribution ERP","Aptean Distribution ERP SWORDS Edition","Aptean Encompix ERP","Aptean Equipment ERP","Aptean Impress ERP","Aptean Industrial Manufacturing ERP Intuitive Edition","Aptean Industrial Manufacturing ERP Traverse Edition","Aptean Industrial Manufacturing ERP WorkWise Edition","Aptean Priam","Aptean Process Manufacturing ERP, Ross Edition","Aptean Southware","Arca EVOLUTION","BILL","CCH Axcess","Cegid","Cegid Quadra","Cegid Retail","Cin7","Comarch ERP Optima","Cyncly RFMS ERP","DELMIAWorks","Datacor","Deltek Ajera","Deltek Costpoint","Deltek GovWin IQ","Deltek Vantagepoint","Deltek Vision","Divalto ERP","ECI Deacom","ECI Horizon","ECI JobBOSS\u00B2","ECI M1","ECI Macola","ECI RockSolid MAX","ECI Spruce","ECI Trimergo","Epicor 10","Epicor 9","Epicor BisTrack","Epicor Eclipse","Epicor Kinetic","Epicor Prophet 21","Exact Globe+","Exact JobBOSS","Exact MAX","Exact Macola","Exact Synergy","Famous ERP","Forterro","Forterro Orderwise","Foundation Software","Genius ERP","Global Shop Solutions","IFS","Infor Anael","Infor Distribution A+","Infor Distribution FACTS","Infor Distribution SX.e","Infor LN","Infor LX","Infor M3","Infor SyteLine","Infor VISUAL","Infor XA","JD Power","Jeeves ERP","Koble","Koble EBMS","Lawson","M2M ERP","MYOB","MYOB Business AccountRight Plus","MYOB Exo","MYOB Greentree","Microsoft Dynamics 365","Microsoft Dynamics 365 Business Central","Microsoft Dynamics 365 for Finance and Operations","Microsoft Dynamics AX","Microsoft Dynamics GP","Odoo","Oracle JD Edwards EnterpriseOne","Oracle NetSuite","Outplay","Pentagon 2000SQL","Plex","Print ePS Monarch","Priority","ProcessPro","Procore","Produce Pro Software","Pronto Software","QAD","QuickBooks Desktop","QuickBooks Online","SAP","SAP Ariba","SAP Business ByDesign","SAP Business One (B1)","SAP ECC6","SPINP ERP","Sage 100","Sage 100 Contractor","Sage 200","Sage 200 Evolution","Sage 300","Sage 300 Construction and Real Estate","Sage 50","Sage 500","Sage Accounting","Sage Active","Sage BusinessWorks","Sage Intacct","Sage Line 500","Sage X3","SelectLine","ShopWorks","Syspro","Trimble Spectrum","VAI S2K Enterprise","Vision ERP","Visma","Workday","Xero","Zoho Books","Zucchetti","e-conomic","eSOLVER"]

const CRMS_APPS = ["1WorldSync","ActiveCampaign","Adobe Campaign","Adobe Commerce","Adobe Experience Manager","Adobe Marketo Engage","Advyzon","Agentforce Field Service and Operations","Amazon Seller Central","Amazon Vendor Central","Anaplan","Applied Indio","Apptivo","Aspire","Autotask PSA","Benelinx","BigChange","BigCommerce","Blackbaud CRM","Briostack","CINC Systems","ClickUp","Clio","Close CRM","ConnectWise","Copper","Cotality DASH","Coupa","Creatio","Cybersource","DocuWare","eBay","eClinicalWorks","Expensify","FedEx Ship Manager","Finale Inventory","Fishbowl","Flex Inventory Management","Freshworks Freshdesk","Freshworks Freshsales","Fullbay","Genesys","GiveCampus","GoHighLevel","Housecall Pro","HubSpot Marketing Hub","HubSpot Sales Hub","HubSpot Service Hub","Hubspot","Infor CloudSuite","Insightly","Inventory Planner by Sage","Jobber","Kantata","Katana","Keap","Klaviyo","Mews","Microsoft Dataverse","Microsoft Dynamics 365","Microsoft Dynamics 365 Field Service","Microsoft SharePoint","Microsoft SQL Server","Mitchell RepairCenter","Mixpanel","NCR Voyix","Neon One","NetHunt","NetSuite SuiteCommerce","NuORDER by Lightspeed","OPEX Cortex","OneAdvanced","Ontraport","OptimoRoute","PatronManager","Pipedrive","Point of Rental","PTC ServiceMax","Quickbase","ROLLER","Recurly","Replicon","Rev.io","RingCentral","Rolldog","SAP Commerce Cloud","SAP CRM","SPS Commerce","Sage CRM","Sage Estimating","Sage Fixed Assets","Sage HR","Sage Inventory Advisor","Sage Network","Sage Payroll","Sage People","Sage Timeslips","Sage Workplace","Salesforce","Salesforce Commerce Cloud","Salesforce Data 360","Salesforce Sales Cloud","Salesforce Service Cloud","Salesloft","SecturaFAB","Sellsy","ServiceNow","ServiceTitan","ShipStation","Shopify","Shopware","Smartlead","Smartsheet","Squarespace","Stack Internal","Stella Source","Stripe","SugarCRM","SuiteCRM","Trimble Supplier Xchange","Tripleseat","TrueCommerce Nexternal","UKG Pro","UPS","Veeva","Voyado","Walmart Marketplace","Wayfair","Wealthbox","Wix","WizCommerce","WooCommerce","Wrike","Xactly","Zendesk","Zoho","Zoho Analytics","Zoho CRM","Zoho Desk","Zoho Expense","Zoho Field Service Management","Zoho Inventory","Zoom Contact Center","Zoominfo","Zuora","Zuper","inFlow","isolved","monday.com"]

function SystemPicker({ type, selected, onToggle, noSystem, onToggleNone }) {
  const [search, setSearch] = useState('')
  const items = type === 'erp' ? ERPS : CRMS_APPS
  const filtered = items.filter(i => i.toLowerCase().includes(search.toLowerCase()))
  const label = type === 'erp' ? 'ERP' : 'CRM / App'
  const noneLabel = type === 'erp' ? 'No ERP \u2014 standalone app' : 'No CRM \u2014 ERP only'
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
      <div style={{ padding: '7px 10px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 500, color: 'var(--text-muted)' }}>
        <span>{label}</span>
        <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>{noSystem ? 'none' : selected.size ? `${selected.size} selected` : '0 selected'}</span>
      </div>
      <div style={{ padding: '5px 8px', borderBottom: '1px solid var(--border)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--text-muted)' }}>
          <input type="checkbox" checked={noSystem} onChange={e => onToggleNone(e.target.checked)} style={{ width: 13, height: 13 }} />
          {noneLabel}
        </label>
      </div>
      <div style={{ padding: '5px 7px', borderBottom: '1px solid var(--border)' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${label}s\u2026`} style={{ fontSize: 12, padding: '4px 8px' }} />
      </div>
      <div style={{ maxHeight: 180, overflowY: 'auto' }}>
        {filtered.length === 0 && <div style={{ padding: '6px 10px', fontSize: 12, color: 'var(--text-dim)', fontStyle: 'italic' }}>No matches</div>}
        {filtered.map(item => (
          <div key={item} onClick={() => onToggle(item)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', fontSize: 12, cursor: 'pointer', background: selected.has(item) ? 'var(--accent-light)' : 'transparent', color: selected.has(item) ? 'var(--accent)' : 'var(--text-muted)' }}>
            <input type="checkbox" checked={selected.has(item)} onChange={() => onToggle(item)} onClick={e => e.stopPropagation()} style={{ width: 12, height: 12, flexShrink: 0 }} />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function LimitPill({ label, current, max }) {
  const pct = current / max
  const cls = pct > 1 ? 'badge-red' : pct > 0.85 ? 'badge-amber' : 'badge-green'
  return <span className={`badge ${cls}`} style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{label}: {current}/{max}</span>
}

function ResultCard({ marketplace, result, onSave, onDelete, resultKey }) {
  const [expanded, setExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [local, setLocal] = useState(result)
  const set = (k, v) => setLocal(r => ({ ...r, [k]: v }))
  const g = marketplace.guidelines
  const copyAll = () => {
    const text = `MARKETPLACE: ${marketplace.name}\n\nTITLE:\n${local.title}\n\nSHORT DESCRIPTION:\n${local.shortDescription}\n\nLONG DESCRIPTION:\n${local.longDescription}\n\nFEATURES:\n${(local.features || []).map((f, i) => `${i + 1}. ${f}`).join('\n')}\n\nTAGS:\n${(local.tags || []).join(', ')}`
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const handleSave = () => {
    onSave(marketplace.id, local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-header-left">
          <div className="mp-badge" style={{ background: marketplace.color, color: marketplace.textColor }}>{marketplace.icon}</div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{marketplace.name}</div>
        </div>
        <div className="result-actions">
          <button className="btn btn-ghost btn-sm" onClick={copyAll}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy all'}</button>
          <button className="btn btn-ghost btn-sm" onClick={handleSave}>{saved ? <Check size={13} /> : <Save size={13} />}{saved ? 'Saved!' : 'Save'}</button>
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(resultKey)}><Trash2 size={13} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => !e)}>{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
        </div>
      </div>
      {expanded && (
        <div className="result-body">
          <div className="limit-bar">
            <LimitPill label="Title" current={(local.title || '').length} max={g.maxTitle} />
            <LimitPill label="Short" current={(local.shortDescription || '').length} max={g.maxShortDesc} />
            <LimitPill label="Long" current={(local.longDescription || '').length} max={g.maxDesc} />
          </div>
          <div className="form-group"><label>App title</label><input value={local.title || ''} onChange={e => set('title', e.target.value)} /></div>
          <div className="form-group"><label>Short description</label><textarea value={local.shortDescription || ''} onChange={e => set('shortDescription', e.target.value)} style={{ minHeight: 56 }} /></div>
          <div className="form-group"><label>Long description</label><textarea value={local.longDescription || ''} onChange={e => set('longDescription', e.target.value)} style={{ minHeight: 140 }} /></div>
          <div className="form-group"><label>Features (one per line)</label><textarea value={(local.features || []).join('\n')} onChange={e => set('features', e.target.value.split('\n'))} style={{ minHeight: 80 }} /></div>
          <div className="form-group"><label>Tags</label><input value={(local.tags || []).join(', ')} onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()))} /></div>
          {local.complianceNotes && local.complianceNotes.length > 0 && (
            <div className="compliance-notes">
              <p><AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />Compliance review notes</p>
              <ul>{local.complianceNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          )}
          {marketplace.guidelines.nextSteps && marketplace.guidelines.nextSteps.length > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Image size={13} /> Next steps to complete this listing
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {marketplace.guidelines.nextSteps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    <CheckCircle size={13} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-dim)' }} />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function GeneratePage({ marketplaces, onSaveVersion, generatedResults, setGeneratedResults, generatedPairs, setGeneratedPairs, generatedMpIds, setGeneratedMpIds, onClearGenerated }) {
  const [tab, setTab] = useState('input')
  const [appName, setAppName] = useState('')
  const [appVersion, setAppVersion] = useState('')
  const [appDesc, setAppDesc] = useState('')
  const [selErps, setSelErps] = useState(new Set())
  const [selCrms, setSelCrms] = useState(new Set())
  const [noErp, setNoErp] = useState(false)
  const [noCrm, setNoCrm] = useState(false)
  const [selMps, setSelMps] = useState(new Set(['hubspot', 'salesforce']))
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')

  const toggleErp = (name) => { setSelErps(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }); setNoErp(false) }
  const toggleCrm = (name) => { setSelCrms(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }); setNoCrm(false) }
  const toggleNoErp = (v) => { setNoErp(v); if (v) setSelErps(new Set()) }
  const toggleNoCrm = (v) => { setNoCrm(v); if (v) setSelCrms(new Set()) }
  const toggleMp = (id) => setSelMps(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })

  const getPairs = () => {
    const pairs = []
    if (noErp && noCrm) return [{ erp: null, crm: null, label: 'Standalone' }]
    if (noErp) { selCrms.forEach(c => pairs.push({ erp: null, crm: c, label: c })); return pairs }
    if (noCrm) { selErps.forEach(e => pairs.push({ erp: e, crm: null, label: e })); return pairs }
    if (!selErps.size && !selCrms.size) return []
    if (!selErps.size) { selCrms.forEach(c => pairs.push({ erp: null, crm: c, label: c })); return pairs }
    if (!selCrms.size) { selErps.forEach(e => pairs.push({ erp: e, crm: null, label: e })); return pairs }
    selErps.forEach(e => selCrms.forEach(c => pairs.push({ erp: e, crm: c, label: `${e} + ${c}` })))
    return pairs
  }

  const currentPairs = getPairs()

  const handleDeleteResult = (key) => {
    setGeneratedResults(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const generate = async () => {
    if (!appName.trim()) { alert('Please enter an app name.'); return }
    if (!appDesc.trim()) { alert('Please enter a one-line description.'); return }
    if (!currentPairs.length) { alert('Select at least one ERP or CRM/App, or check standalone.'); return }
    if (!selMps.size) { alert('Select at least one marketplace.'); return }

    setGenerating(true)
    setTab('output')
    const newResults = { ...generatedResults }
    const mps = marketplaces.filter(m => selMps.has(m.id))
    const total = currentPairs.length * mps.length
    let done = 0

    // Store pairs and mp ids for persistence
    setGeneratedPairs(currentPairs)
    setGeneratedMpIds([...selMps])

    for (const pair of currentPairs) {
      for (const mp of mps) {
        done++
        setProgress(`Generating ${pair.label} \u00D7 ${mp.name}\u2026 (${done}/${total})`)
        const key = `${pair.label}||${mp.id}`
        try {
          const g = mp.guidelines
          const sysLine = pair.erp && pair.crm ? `connecting ${pair.erp} (ERP) to ${pair.crm}` : pair.erp ? `for ${pair.erp} ERP users` : pair.crm ? `connecting to ${pair.crm}` : 'as a standalone integration'
          const prompt = `You are an expert app marketplace copywriter for Commercient, specialists in ERP/CRM integration software.

Generate a fully compliant listing for "${appName}" ${sysLine}, for the ${mp.name} marketplace.

APP INFO:
- App: ${appName} ${sysLine}
- Version: ${appVersion || 'current'}
- Description: ${appDesc}
${pair.erp ? `- ERP: ${pair.erp}` : ''}
${pair.crm ? `- CRM/App: ${pair.crm}` : ''}
- Company: Commercient

${mp.name.toUpperCase()} GUIDELINES:
- Title: STRICTLY max ${g.maxTitle} characters. Count every character carefully. Do not use colons or semicolons in the title.
- Short description: STRICTLY max ${g.maxShortDesc} characters. Count every character carefully.
- Long description: STRICTLY max ${g.maxDesc} characters. Count every character carefully. This is the HARD LIMIT. Do NOT exceed it.
- Features: max ${g.maxFeatures}, each STRICTLY max ${g.maxFeatureLen} characters
- Tags: max ${g.maxTags}
- Tone: ${g.tone}
- Rules: ${g.rules.join(' | ')}

CRITICAL FORMATTING RULES:
- ALL text must be PLAIN TEXT ONLY.
- Do NOT use any HTML tags (no <h1>, <h2>, <p>, <br>, <b>, <strong>, <ul>, <li>, etc.)
- Do NOT use any markdown formatting (no #, ##, **, *, -, etc.)
- Do NOT use any special formatting characters or heading syntax.
- Write the long description as natural flowing paragraphs separated by blank lines.
- The long description MUST be under ${g.maxDesc} characters. Count carefully. If approaching the limit, write less.
- The title MUST be under ${g.maxTitle} characters and must NOT contain colons or semicolons.
- The short description MUST be under ${g.maxShortDesc} characters.

TONE AND LANGUAGE RULES:
- Do NOT use any sales or marketing language.
- Do NOT use phrases like "get started today", "work harder", "unlock", "supercharge", "revolutionize", "game-changing", "seamless", or any calls to action.
- Write in a factual, descriptive, technical tone.
- Focus on what the integration does, how it works, and what data it syncs.
- Describe capabilities, not promises. State facts, not pitches.

Use your knowledge of both platforms to write an accurate factual listing. Return ONLY valid JSON no preamble:
{"title":"","shortDescription":"","longDescription":"","features":[],"tags":[],"complianceNotes":[]}`

          const resp = await fetch('/.netlify/functions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, guidelineUrls: mp.guidelineUrls || [] })
          })
          if (!resp.ok) { const err = await resp.json(); throw new Error(err.error || 'Server error') }
          const data = await resp.json()

          if (data.longDescription) {
            data.longDescription = data.longDescription.replace(/<[^>]*>/g, '').replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').trim()
          }
          if (data.shortDescription) {
            data.shortDescription = data.shortDescription.replace(/<[^>]*>/g, '').trim()
          }
          if (data.title) {
            data.title = data.title.replace(/<[^>]*>/g, '').trim()
          }

          newResults[key] = data
          setGeneratedResults({ ...newResults })
        } catch (e) {
          newResults[key] = { error: true, message: e.message }
          setGeneratedResults({ ...newResults })
        }
      }
    }
    setGenerating(false)
    setProgress('')
  }

  const resultCount = Object.keys(generatedResults).length
  const displayPairs = generatedPairs.length > 0 ? generatedPairs : currentPairs
  const displayMpIds = generatedMpIds.length > 0 ? generatedMpIds : [...selMps]
  const displayMps = marketplaces.filter(m => displayMpIds.includes(m.id))

  return (
    <div className="page">
      <div className="tabs">
        <button className={`tab ${tab === 'input' ? 'active' : ''}`} onClick={() => setTab('input')}>App details</button>
        <button className={`tab ${tab === 'output' ? 'active' : ''}`} onClick={() => setTab('output')}>Generated listings {resultCount > 0 ? `(${resultCount})` : ''}</button>
      </div>
      {tab === 'input' && (
        <>
          <div className="card">
            <div className="card-title">App details</div>
            <div className="form-grid">
              <div className="form-group"><label>App name</label><input value={appName} onChange={e => setAppName(e.target.value)} placeholder="e.g. CommercialSync" /></div>
              <div className="form-group"><label>Version (optional)</label><input value={appVersion} onChange={e => setAppVersion(e.target.value)} placeholder="e.g. 2.1" /></div>
            </div>
            <div className="form-group">
              <label>One-line description &mdash; applies to all listings</label>
              <textarea value={appDesc} onChange={e => setAppDesc(e.target.value)} placeholder="e.g. Syncs customer accounts, orders, invoices and inventory between ERP and CRM systems in real time, eliminating manual data entry." style={{ minHeight: 72 }} />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Select systems to connect</div>
            <div className="form-grid">
              <SystemPicker type="erp" selected={selErps} onToggle={toggleErp} noSystem={noErp} onToggleNone={toggleNoErp} />
              <SystemPicker type="crm" selected={selCrms} onToggle={toggleCrm} noSystem={noCrm} onToggleNone={toggleNoCrm} />
            </div>
            {currentPairs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {currentPairs.map(p => <span key={p.label} style={{ padding: '3px 10px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{p.label}</span>)}
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-title">Target marketplaces</div>
            <div className="chip-list">
              {marketplaces.map(mp => (
                <div key={mp.id} className={`chip ${selMps.has(mp.id) ? 'selected' : ''}`} onClick={() => toggleMp(mp.id)}>
                  <span className="chip-dot" style={{ background: mp.color }} />{mp.name}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>Each listing follows that marketplace's character limits and content rules automatically.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              <Sparkles size={14} />
              {generating ? 'Generating\u2026' : `Generate ${currentPairs.length * selMps.size} listing${currentPairs.length * selMps.size !== 1 ? 's' : ''}`}
            </button>
            {currentPairs.length > 0 && selMps.size > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentPairs.length} pair{currentPairs.length !== 1 ? 's' : ''} \u00D7 {selMps.size} marketplace{selMps.size !== 1 ? 's' : ''}</span>}
          </div>
        </>
      )}
      {tab === 'output' && (
        <>
          {generating && <div className="loading-row"><div className="spinner" />{progress}</div>}
          {!generating && resultCount === 0 && <div className="empty-state"><div className="empty-state-icon">{'\u2726'}</div><h3>No listings generated yet</h3><p>Fill in your app details and click Generate.</p></div>}
          {resultCount > 0 && !generating && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={onClearGenerated}><Trash2 size={12} /> Clear all generated listings</button>
            </div>
          )}
          {displayPairs.filter(p => displayMps.some(m => generatedResults[`${p.label}||${m.id}`])).map(pair => (
            <div key={pair.label}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', padding: '8px 2px 6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pair.label}</div>
              {displayMps.map(mp => {
                const key = `${pair.label}||${mp.id}`
                const r = generatedResults[key]
                if (!r) return null
                if (r.error) return <div key={mp.id} className="result-card" style={{ padding: 14, fontSize: 13, color: 'var(--red)' }}>{mp.name}: {r.message || 'Generation failed'}</div>
                return <ResultCard key={mp.id} marketplace={mp} result={r} onSave={onSaveVersion} onDelete={handleDeleteResult} resultKey={key} />
              })}
            </div>
          ))}
        </>
      )}
    </div>
  )
}