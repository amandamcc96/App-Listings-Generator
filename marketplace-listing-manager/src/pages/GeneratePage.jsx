import { useState, useEffect, useRef } from 'react'
import { Sparkles, Copy, Check, ChevronDown, ChevronUp, AlertTriangle, Save, Image, CheckCircle, Trash2, RefreshCw, XCircle } from 'lucide-react'

const ERPS = ["AFAS Software","Abas","AccountsIQ","Acumatica","Agility ERP","Applied Epic","Aptean Apparel ERP Full Circle Edition","Aptean Discrete Manufacturing ERP Made2Manage Edition","Aptean Distribution ERP","Aptean Distribution ERP SWORDS Edition","Aptean Encompix ERP","Aptean Equipment ERP","Aptean Impress ERP","Aptean Industrial Manufacturing ERP Intuitive Edition","Aptean Industrial Manufacturing ERP Traverse Edition","Aptean Industrial Manufacturing ERP WorkWise Edition","Aptean Priam","Aptean Process Manufacturing ERP, Ross Edition","Aptean Southware","Arca EVOLUTION","BILL","CCH Axcess","Cegid","Cegid Quadra","Cegid Retail","Cin7","Comarch ERP Optima","Cyncly RFMS ERP","DELMIAWorks","Datacor","Deltek Ajera","Deltek Costpoint","Deltek GovWin IQ","Deltek Vantagepoint","Deltek Vision","Divalto ERP","ECI Deacom","ECI Horizon","ECI JobBOSS\u00B2","ECI M1","ECI Macola","ECI RockSolid MAX","ECI Spruce","ECI Trimergo","Epicor 10","Epicor 9","Epicor BisTrack","Epicor Eclipse","Epicor Kinetic","Epicor Prophet 21","Exact Globe+","Exact JobBOSS","Exact MAX","Exact Macola","Exact Synergy","Famous ERP","Forterro","Forterro Orderwise","Foundation Software","Genius ERP","Global Shop Solutions","IFS","Infor Anael","Infor Distribution A+","Infor Distribution FACTS","Infor Distribution SX.e","Infor LN","Infor LX","Infor M3","Infor SyteLine","Infor VISUAL","Infor XA","JD Power","Jeeves ERP","Koble","Koble EBMS","Lawson","M2M ERP","MYOB","MYOB Business AccountRight Plus","MYOB Exo","MYOB Greentree","Microsoft Dynamics 365","Microsoft Dynamics 365 Business Central","Microsoft Dynamics 365 for Finance and Operations","Microsoft Dynamics AX","Microsoft Dynamics GP","Odoo","Oracle JD Edwards EnterpriseOne","Oracle NetSuite","Outplay","Pentagon 2000SQL","Plex","Print ePS Monarch","Priority","ProcessPro","Procore","Produce Pro Software","Pronto Software","QAD","QuickBooks Desktop","QuickBooks Online","SAP","SAP Ariba","SAP Business ByDesign","SAP Business One (B1)","SAP ECC6","SPINP ERP","Sage 100","Sage 100 Contractor","Sage 200","Sage 200 Evolution","Sage 300","Sage 300 Construction and Real Estate","Sage 50","Sage 500","Sage Accounting","Sage Active","Sage BusinessWorks","Sage Intacct","Sage Line 500","Sage X3","SelectLine","ShopWorks","Syspro","Trimble Spectrum","VAI S2K Enterprise","Vision ERP","Visma","Workday","Xero","Zoho Books","Zucchetti","e-conomic","eSOLVER"]

const CRMS_APPS = ["1WorldSync","ActiveCampaign","Adobe Campaign","Adobe Commerce","Adobe Experience Manager","Adobe Marketo Engage","Advyzon","Agentforce Field Service and Operations","Amazon Seller Central","Amazon Vendor Central","Anaplan","Applied Indio","Apptivo","Aspire","Autotask PSA","Benelinx","BigChange","BigCommerce","Blackbaud CRM","Briostack","CINC Systems","ClickUp","Clio","Close CRM","ConnectWise","Copper","Cotality DASH","Coupa","Creatio","Cybersource","DocuWare","eBay","eClinicalWorks","Expensify","FedEx Ship Manager","Finale Inventory","Fishbowl","Flex Inventory Management","Freshworks Freshdesk","Freshworks Freshsales","Fullbay","Genesys","GiveCampus","GoHighLevel","Housecall Pro","HubSpot Marketing Hub","HubSpot Sales Hub","HubSpot Service Hub","Hubspot","Infor CloudSuite","Insightly","Inventory Planner by Sage","Jobber","Kantata","Katana","Keap","Klaviyo","Mews","Microsoft Dataverse","Microsoft Dynamics 365","Microsoft Dynamics 365 Field Service","Microsoft SharePoint","Microsoft SQL Server","Mitchell RepairCenter","Mixpanel","NCR Voyix","Neon One","NetHunt","NetSuite SuiteCommerce","NuORDER by Lightspeed","OPEX Cortex","OneAdvanced","Ontraport","OptimoRoute","PatronManager","Pipedrive","Point of Rental","PTC ServiceMax","Quickbase","ROLLER","Recurly","Replicon","Rev.io","RingCentral","Rolldog","SAP Commerce Cloud","SAP CRM","SPS Commerce","Sage CRM","Sage Estimating","Sage Fixed Assets","Sage HR","Sage Inventory Advisor","Sage Network","Sage Payroll","Sage People","Sage Timeslips","Sage Workplace","Salesforce","Salesforce Commerce Cloud","Salesforce Data 360","Salesforce Sales Cloud","Salesforce Service Cloud","Salesloft","SecturaFAB","Sellsy","ServiceNow","ServiceTitan","ShipStation","Shopify","Shopware","Smartlead","Smartsheet","Squarespace","Stack Internal","Stella Source","Stripe","SugarCRM","SuiteCRM","Trimble Supplier Xchange","Tripleseat","TrueCommerce Nexternal","UKG Pro","UPS","Veeva","Voyado","Walmart Marketplace","Wayfair","Wealthbox","Wix","WizCommerce","WooCommerce","Wrike","Xactly","Zendesk","Zoho","Zoho Analytics","Zoho CRM","Zoho Desk","Zoho Expense","Zoho Field Service Management","Zoho Inventory","Zoom Contact Center","Zoominfo","Zuora","Zuper","inFlow","isolved","monday.com"]

// Splits the knowledge base into labeled blocks on "====...====\nHEADER\n====...====" dividers,
// then further splits each block on ALL-CAPS subheadings (e.g. "SYNC PRICING (...):") so that
// selection can pull just a pricing table or support section instead of a whole 5,000-char product block.
function parseKnowledgeBlocks(text) {
  if (!text) return []
  const topBlocks = []
  const dividerRe = /={5,}\s*\n(.+?)\n={5,}/g
  const matches = [...text.matchAll(dividerRe)]
  if (matches.length === 0) {
    topBlocks.push({ header: 'KNOWLEDGE BASE', content: text.trim() })
  } else {
    if (matches[0].index > 0) {
      const pre = text.slice(0, matches[0].index).trim()
      if (pre) topBlocks.push({ header: 'COMPANY OVERVIEW', content: pre })
    }
    for (let i = 0; i < matches.length; i++) {
      const header = matches[i][1].trim()
      const contentStart = matches[i].index + matches[i][0].length
      const contentEnd = i + 1 < matches.length ? matches[i + 1].index : text.length
      const content = text.slice(contentStart, contentEnd).trim()
      if (content) topBlocks.push({ header, content })
    }
  }
  // Second pass: split each top block on ALL-CAPS subheading lines like "SYNC PRICING (three cost components):"
  const subheadRe = /^[A-Z][A-Z0-9&/,.'-]*(?:\s+[A-Z0-9&/,.'-]+)*(?:\s*\([^)]*\))?:\s*$/
  const blocks = []
  for (const tb of topBlocks) {
    const lines = tb.content.split('\n')
    let currentSub = null
    let buf = []
    const flush = () => {
      const body = buf.join('\n').trim()
      if (!body) return
      blocks.push({ header: currentSub ? `${tb.header} — ${currentSub}` : tb.header, content: currentSub ? `${currentSub}\n${body}` : body })
    }
    for (const line of lines) {
      if (subheadRe.test(line.trim())) {
        flush()
        currentSub = line.trim().replace(/:$/, '')
        buf = []
      } else {
        buf.push(line)
      }
    }
    flush()
  }
  return blocks
}

// Always-relevant blocks worth including regardless of topic match (naming rules, contact info) — kept short
const ALWAYS_INCLUDE_HEADERS = ['NAMING AND MESSAGING RULES', 'COMPANY OVERVIEW']

// Score a block by how many query terms appear in its header+content, then return the
// best-matching blocks concatenated, capped to maxChars so every call stays small and fast.
function selectKnowledge(blocks, queryText, maxChars) {
  if (!blocks.length) return ''
  const STOPWORDS = new Set(['commercient', 'company', 'product', 'the', 'and', 'for', 'with', 'that', 'this'])
  const terms = String(queryText).toLowerCase().match(/[a-z0-9]{3,}/g) || []
  const termSet = [...new Set(terms)].filter(t => !STOPWORDS.has(t))
  const scored = blocks.map(b => {
    const hay = (b.header + ' ' + b.content).toLowerCase()
    let score = termSet.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0)
    if (ALWAYS_INCLUDE_HEADERS.some(h => b.header.toUpperCase().includes(h))) score += 0.5
    return { ...b, score }
  }).sort((a, b) => b.score - a.score)

  let out = ''
  let tookAny = false
  for (const b of scored) {
    if (b.score <= 0 && tookAny) break // once relevant matches run out, stop
    const piece = `[${b.header}]\n${b.content}\n\n`
    if (out.length + piece.length > maxChars) {
      if (!tookAny) { out = piece.slice(0, maxChars); tookAny = true } // ensure at least something fits
      continue // this block is too big for remaining space — skip it, keep trying smaller ones
    }
    out += piece
    tookAny = true
  }
  return out.trim()
}

// Extract a meaningful feature title from a description when the AI leaves the name blank.
// Integration features follow a pattern: [data objects] [verb] between [systems].
// We extract the subject noun phrase and pair it with an action word.
function extractFeatureName(desc) {
  if (!desc) return 'Data Integration Feature'
  let text = desc.trim()
  // Strip leading product names and generic subjects that aren't the actual feature
  text = text.replace(/^(SYNC|Commercient SYNC|Commercient|The integration|This integration|This feature|The connector)\s+(runs|supports|uses|is built|provides|enables|offers|includes|allows|delivers)\s+/i, '')
  // Also strip "on/on a/in" after the verb was removed
  text = text.replace(/^(on a|on|in|via|through|from)\s+/i, '')
  // Find where the main verb phrase starts — everything before it is the subject
  const verbRe = /\b(are|is|can be|will be|gets?)\s+(replicated|synced|synchronized|made available|transferred|written|updated|pushed|pulled|imported|exported|integrated|moved|mapped|delivered|maintained|configured|adjusted|supported|built|designed)/i
  const verbMatch = text.match(verbRe)
  let subject = verbMatch ? text.slice(0, verbMatch.index).trim() : text.split(/[.,;!?]/)[0].trim()
  // Strip trailing "from [System]" or "maintained in [System]" clauses
  subject = subject.replace(/\s+(from|maintained in|stored in|managed in|tracked in|kept in|in|within|between|for)\s+[A-Z][\w\s]*$/i, '').trim()
  // Strip trailing verb phrases like "to move data", "that links CRM", "designed for"
  subject = subject.replace(/\s+(to|that|which|designed|configured|intended)\s+\w.*$/i, '').trim()
  // Strip leading articles and residual product names
  subject = subject.replace(/^(the|a|an|this|each|all|every|Commercient'?s?|SYNC'?s?)\s+/gi, '').trim()
  // Strip leading "library of" type phrases
  subject = subject.replace(/^(library of|collection of|set of)\s+/i, '').trim()
  // Cap at 6 words, title-case
  let words = subject.split(/\s+/).slice(0, 6)
  // If after extraction we have very few meaningful words, try the first clause of the original
  if (words.length < 2 || words.join(' ').length < 8) {
    const firstClause = desc.split(/[.,;!?]/)[0].replace(/^(the|a|an|this|SYNC|Commercient)\s+/gi, '').trim()
    words = firstClause.split(/\s+/).slice(0, 6)
  }
  const titleCased = words.map((w, idx) => {
    if (['and', 'or', 'the', 'a', 'an', 'in', 'of', 'to', 'for', 'by', 'on', 'at'].includes(w.toLowerCase()) && idx > 0) return w.toLowerCase()
    return w.charAt(0).toUpperCase() + w.slice(1)
  }).join(' ')
    // Final cleanup: strip trailing participles, prepositions, and filler words from the title
    .replace(/\s+(Designed|Configured|Built|Reduces?|Enables?|Provides?|Includes?|Including)\b.*$/i, '')
    .replace(/,\s*$/, '')
    .trim()
  // Derive an action word from the verb if found
  if (verbMatch) {
    const verb = verbMatch[2].toLowerCase()
    const actionMap = { 'replicated': 'Sync', 'synced': 'Sync', 'synchronized': 'Sync', 'transferred': 'Sync', 'moved': 'Sync', 'mapped': 'Mapping', 'pushed': 'Sync', 'pulled': 'Sync', 'imported': 'Import', 'exported': 'Export', 'integrated': 'Integration', 'made available': 'Visibility', 'written': 'Write-back', 'updated': 'Updates', 'delivered': 'Delivery', 'maintained': 'Management', 'configured': 'Configuration', 'adjusted': 'Configuration', 'supported': 'Support', 'built': 'Templates', 'designed': 'Templates' }
    const action = actionMap[verb] || 'Sync'
    if (!titleCased.toLowerCase().includes(action.toLowerCase())) {
      return `${titleCased} ${action}`
    }
  }
  return titleCased || 'Data Integration Feature'
}

// Guarantee a string fits within max chars, cutting at a sentence boundary when possible, else a word boundary
function fitText(text, max) {
  if (!text || typeof max !== 'number' || max <= 0 || text.length <= max) return { text, trimmed: false }
  let slice = text.slice(0, max)
  const boundary = Math.max(slice.lastIndexOf('. '), slice.lastIndexOf('.\n'), slice.lastIndexOf('! '), slice.lastIndexOf('? '))
  if (boundary > max * 0.6) {
    return { text: slice.slice(0, boundary + 1).trim(), trimmed: true }
  }
  const lastSpace = slice.lastIndexOf(' ')
  if (lastSpace > 0) slice = slice.slice(0, lastSpace)
  return { text: slice.trim(), trimmed: true }
}

// Normalize a feature to a display string. The AI may return plain strings or {name, description} objects.
function featureToString(f) {
  if (!f) return ''
  if (typeof f === 'string') return f
  if (typeof f === 'object') {
    const name = f.name || f.title || ''
    const desc = f.description || f.detail || ''
    if (name && desc) return `${name}: ${desc}`
    return name || desc || String(f)
  }
  return String(f)
}

// Normalize features array — handles both string[] and object[] from the AI
function normalizeFeatures(features) {
  if (!Array.isArray(features)) return []
  return features.map(featureToString).filter(Boolean)
}

// Section content should be a plain string, but the AI sometimes returns arrays/objects
// (e.g. pricing plans). Convert any shape into readable plain text.
function sectionContentToString(c) {
  if (c == null) return ''
  if (typeof c === 'string') return c
  if (Array.isArray(c)) return c.map(sectionContentToString).filter(Boolean).join('\n\n')
  if (typeof c === 'object') {
    return Object.entries(c).map(([k, v]) => {
      const label = k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, ch => ch.toUpperCase())
      const val = typeof v === 'string' ? v : Array.isArray(v) ? v.map(x => (typeof x === 'string' ? x : sectionContentToString(x))).join(', ') : sectionContentToString(v)
      return `${label}: ${val}`
    }).join('\n')
  }
  return String(c)
}

// Classify marketplace nextSteps items: visual assets vs external links vs generatable text
const VISUAL_KEYWORDS = ['icon', 'screenshot', 'image', 'video', 'demo', 'logo', 'png', 'jpg', 'jpeg', 'pixel', 'px', 'photo', 'recording']
const EXTERNAL_KEYWORDS = ['url', 'link', 'website', 'prepare a live', 'prepare live', 'terms of service', 'privacy policy']
const isVisualStep = (s) => VISUAL_KEYWORDS.some(k => String(s).toLowerCase().includes(k))
const isExternalStep = (s) => EXTERNAL_KEYWORDS.some(k => String(s).toLowerCase().includes(k))

// Canonical section buckets. Multiple near-duplicate checklist items (e.g. three different
// pricing-related lines from merged guideline scans) collapse into ONE generated section each.
// First matching bucket wins, so order matters (pricing before featuresList, since a pricing
// item may mention "features list" inside it).
const SECTION_BUCKETS = [
  { id: 'pricing', label: 'Pricing plans', match: ['pricing', 'price plan'] },
  { id: 'sharedData', label: 'Shared data', match: ['shared data', 'scopes and data', 'data objects the app'] },
  { id: 'platFeatures', label: 'Platform features the app works with', match: ['features the app works with', 'hubspot features', 'salesforce features'] },
  { id: 'tools', label: 'Other tools the app integrates with', match: ['other tools', 'tools the app integrates'] },
  { id: 'languages', label: 'Languages', match: ['language'] },
  { id: 'searchTerms', label: 'Search terms', match: ['search term', 'keyword'] },
  { id: 'categories', label: 'App categories', match: ['categor'] },
  // Items that duplicate core listing fields — dropped, since the core output already covers them
  { id: 'drop', label: null, match: ['app overview', 'overview copy', 'tagline', 'public app name', 'company name', 'features list', 'app name'] },
  // Trivially derivable — auto-filled without an AI call
  { id: 'urlPath', label: 'URL path', match: ['url path'], autofill: true }
]

// Collapse raw checklist items into curated sections: one entry per bucket (instructions merged),
// unmatched items pass through as their own sections.
function curateSections(rawItems) {
  const buckets = new Map()
  const passthrough = []
  for (const item of rawItems) {
    const lower = String(item).toLowerCase()
    const bucket = SECTION_BUCKETS.find(b => b.match.some(k => lower.includes(k)))
    if (!bucket) { passthrough.push({ label: null, instruction: item }); continue }
    if (bucket.id === 'drop') continue
    if (!buckets.has(bucket.id)) buckets.set(bucket.id, { id: bucket.id, label: bucket.label, autofill: !!bucket.autofill, instructions: [] })
    buckets.get(bucket.id).instructions.push(item)
  }
  const curated = [...buckets.values()].map(b => ({ id: b.id, label: b.label, autofill: b.autofill, instruction: b.instructions.join(' | ') }))
  return { curated, passthrough }
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
}

// Final safety net: drop sections whose normalized labels duplicate or contain one another
function dedupeSections(sections) {
  const seen = []
  const out = []
  for (const sec of sections) {
    if (!sec || !sec.label) continue
    const norm = String(sec.label).toLowerCase().replace(/[^a-z0-9]/g, '')
    if (seen.some(s => s === norm || s.includes(norm) || norm.includes(s))) continue
    seen.push(norm)
    out.push(sec)
  }
  return out
}

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

function LimitPill({ label, current, min, max }) {
  const hasMax = typeof max === 'number' && max > 0
  const hasMin = typeof min === 'number' && min > 0
  let text, cls
  if (hasMax) {
    const over = current > max
    const under = hasMin && current < min
    cls = (over || under) ? 'badge-red' : (current / max > 0.85 ? 'badge-amber' : 'badge-green')
    text = `${label}: ${current}/${max}${hasMin ? ` (min ${min})` : ''}`
  } else if (hasMin) {
    cls = current < min ? 'badge-red' : 'badge-green'
    text = `${label}: ${current} (min ${min})`
  } else {
    // No limit stated in the guidelines — show the honest live count, no invented ceiling
    cls = 'badge-green'
    text = `${label}: ${current}`
  }
  return <span className={`badge ${cls}`} style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{text}</span>
}


function MpLogo({ mp, size, radius, fontSize }) {
  const [imgFailed, setImgFailed] = useState(false)
  const s = size || 24; const r = radius || 6; const fs2 = fontSize || 10
  if (mp.logoDomain && !imgFailed) {
    return (
      <div className="mp-badge" style={{ background: '#fff', width: s, height: s, borderRadius: r, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 2 }}>
       <img src={`https://www.google.com/s2/favicons?domain=${mp.logoDomain}&sz=128`} alt={mp.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={() => setImgFailed(true)} />
      </div>
    )
  }
  return <div className="mp-badge" style={{ background: mp.color, color: mp.textColor, width: s, height: s, borderRadius: r, fontSize: fs2 }}>{mp.icon}</div>
}

function ResultCard({ marketplace, result, onSave, onDelete, onRegenerate, resultKey }) {
  const [expanded, setExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [local, setLocal] = useState(result)
  const set = (k, v) => setLocal(r => ({ ...r, [k]: v }))
  const g = marketplace.guidelines

  const featuresDisplay = Array.isArray(local.features) ? local.features.filter(Boolean) : []
  const additionalSections = local.additionalSections || []
  const visualSteps = (marketplace.guidelines.nextSteps || []).filter(isVisualStep)

  const copyAll = () => {
    const featuresText = featuresDisplay.map((f, i) => {
      if (f && typeof f === 'object' && (f.name || f.description)) {
        return `Feature ${i + 1}\nName: ${f.name || ''}\nDescription: ${f.description || ''}`
      }
      return `Feature ${i + 1}: ${featureToString(f)}`
    }).join('\n\n')
    let text = `MARKETPLACE: ${marketplace.name}\n\nTITLE:\n${local.title}\n\nSHORT DESCRIPTION:\n${local.shortDescription}\n\nLONG DESCRIPTION:\n${local.longDescription}\n\nFEATURES:\n${featuresText}\n\nTAGS:\n${(local.tags || []).join(', ')}`
    for (const sec of additionalSections) {
      text += `\n\n${sec.label.toUpperCase()}:\n${sectionContentToString(sec.content)}`
    }
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  const handleSave = () => {
    onSave(marketplace.id, local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateSection = (i, newContent) => {
    setLocal(r => {
      const secs = [...(r.additionalSections || [])]
      secs[i] = { ...secs[i], content: newContent }
      return { ...r, additionalSections: secs }
    })
  }

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="result-header-left">
          <MpLogo mp={marketplace} />
          <div style={{ fontWeight: 600, fontSize: 13 }}>{marketplace.name}</div>
        </div>
        <div className="result-actions">
          <button className="btn btn-ghost btn-sm" onClick={copyAll}>{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? 'Copied' : 'Copy all'}</button>
          <button className="btn btn-ghost btn-sm" onClick={handleSave}>{saved ? <Check size={13} /> : <Save size={13} />}{saved ? 'Saved!' : 'Save'}</button>
          {onRegenerate && <button className="btn btn-ghost btn-sm" onClick={() => onRegenerate(resultKey)} title="Regenerate this listing"><RefreshCw size={13} /></button>}
          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => onDelete(resultKey)}><Trash2 size={13} /></button>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded(e => !e)}>{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</button>
        </div>
      </div>
      {expanded && (
        <div className="result-body">
          <div className="limit-bar">
            <LimitPill label="Title" current={(local.title || '').length} min={g.minTitle} max={g.maxTitle} />
            <LimitPill label="Short" current={(local.shortDescription || '').length} min={g.minShortDesc} max={g.maxShortDesc} />
            <LimitPill label="Long" current={(local.longDescription || '').length} min={g.minDesc} max={g.maxDesc} />
          </div>
          <div className="form-group"><label>App title</label><input value={local.title || ''} onChange={e => set('title', e.target.value)} /></div>
          <div className="form-group"><label>Short description</label><textarea value={local.shortDescription || ''} onChange={e => set('shortDescription', e.target.value)} style={{ minHeight: 56 }} /></div>
          <div className="form-group"><label>Long description</label><textarea value={local.longDescription || ''} onChange={e => set('longDescription', e.target.value)} style={{ minHeight: 140 }} /></div>
          <div className="form-group">
            <label>Features ({featuresDisplay.length})</label>
            {featuresDisplay.map((f, i) => {
              // Features may be plain strings or {name, description} objects — render both usefully
              const isObj = f && typeof f === 'object' && (f.name || f.description)
              if (isObj) {
                const nameMissing = !f.name || !f.name.trim()
                return (
                  <div key={i} style={{ border: `1px solid ${nameMissing ? 'var(--red)' : 'var(--border)'}`, borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 8, background: 'var(--bg-surface)' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: nameMissing ? 'var(--red)' : 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                      Feature {i + 1}{nameMissing ? ' — name required' : ''}
                    </div>
                    <div className="form-group" style={{ marginBottom: 6 }}>
                      <label style={{ fontSize: 11 }}>Name{nameMissing ? ' ⚠' : ''}</label>
                      <input value={f.name || ''} onChange={e => {
                        const updated = [...local.features]; updated[i] = { ...f, name: e.target.value }; set('features', updated)
                      }} style={{ fontSize: 12, borderColor: nameMissing ? 'var(--red)' : undefined }} placeholder={nameMissing ? 'Enter a feature name (3-8 words)' : ''} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: 11 }}>Description</label>
                      <textarea value={f.description || ''} onChange={e => {
                        const updated = [...local.features]; updated[i] = { ...f, description: e.target.value }; set('features', updated)
                      }} style={{ minHeight: 60, fontSize: 12 }} />
                    </div>
                  </div>
                )
              }
              // Plain string fallback
              return (
                <textarea key={i} value={featureToString(f)} onChange={e => {
                  const updated = [...local.features]; updated[i] = e.target.value; set('features', updated)
                }} style={{ minHeight: 48, marginBottom: 6, fontSize: 12 }} />
              )
            })}
          </div>
          <div className="form-group"><label>Tags</label><input value={(local.tags || []).join(', ')} onChange={e => set('tags', e.target.value.split(',').map(t => t.trim()))} /></div>

          {additionalSections.map((sec, i) => (
            <div key={i} className="form-group">
              <label>{sec.label}</label>
              <textarea value={sectionContentToString(sec.content)} onChange={e => updateSection(i, e.target.value)} style={{ minHeight: 80 }} />
            </div>
          ))}

          {local.complianceNotes && local.complianceNotes.length > 0 && (
            <div className="compliance-notes">
              <p onClick={() => setNotesOpen(o => !o)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none' }}>
                <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                Compliance review notes ({local.complianceNotes.length})
                {notesOpen ? <ChevronUp size={12} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={12} style={{ marginLeft: 'auto' }} />}
              </p>
              {notesOpen && <ul>{local.complianceNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
            </div>
          )}
          {visualSteps.length > 0 && (
            <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px 14px', marginTop: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Image size={13} /> Visual assets to prepare
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {visualSteps.map((step, i) => (
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
  // Persist form state so a refresh or tab-switch never loses work
  const persisted = (key, fallback) => {
    try { const v = localStorage.getItem(key); return v != null ? JSON.parse(v) : fallback } catch { return fallback }
  }
  const [tab, setTab] = useState('input')
  const [appName, setAppName] = useState(() => persisted('gen_appName', ''))
  const [appVersion, setAppVersion] = useState(() => persisted('gen_appVersion', ''))
  const [appDesc, setAppDesc] = useState(() => persisted('gen_appDesc', ''))
  const [selErps, setSelErps] = useState(() => new Set(persisted('gen_selErps', [])))
  const [selCrms, setSelCrms] = useState(() => new Set(persisted('gen_selCrms', [])))
  const [noErp, setNoErp] = useState(() => persisted('gen_noErp', false))
  const [noCrm, setNoCrm] = useState(() => persisted('gen_noCrm', false))
  const [selMps, setSelMps] = useState(() => new Set(persisted('gen_selMps', [])))
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [formError, setFormError] = useState('')
  const [showAllPairs, setShowAllPairs] = useState(false)
  const cancelRef = useRef(false)
  const abortRef = useRef(null)
  const knowledgeBlocksRef = useRef([])

  const loadKnowledge = async () => {
    try {
      const resp = await fetch('/.netlify/functions/product-knowledge')
      const kb = await resp.json()
      knowledgeBlocksRef.current = parseKnowledgeBlocks(kb.content || '')
    } catch (e) {
      knowledgeBlocksRef.current = []
    }
  }

  useEffect(() => { try { localStorage.setItem('gen_appName', JSON.stringify(appName)) } catch {} }, [appName])
  useEffect(() => { try { localStorage.setItem('gen_appVersion', JSON.stringify(appVersion)) } catch {} }, [appVersion])
  useEffect(() => { try { localStorage.setItem('gen_appDesc', JSON.stringify(appDesc)) } catch {} }, [appDesc])
  useEffect(() => { try { localStorage.setItem('gen_selErps', JSON.stringify([...selErps])) } catch {} }, [selErps])
  useEffect(() => { try { localStorage.setItem('gen_selCrms', JSON.stringify([...selCrms])) } catch {} }, [selCrms])
  useEffect(() => { try { localStorage.setItem('gen_noErp', JSON.stringify(noErp)) } catch {} }, [noErp])
  useEffect(() => { try { localStorage.setItem('gen_noCrm', JSON.stringify(noCrm)) } catch {} }, [noCrm])
  useEffect(() => { try { localStorage.setItem('gen_selMps', JSON.stringify([...selMps])) } catch {} }, [selMps])

  const toggleErp = (name) => { setSelErps(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }); setNoErp(false); setFormError('') }
  const toggleCrm = (name) => { setSelCrms(s => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n }); setNoCrm(false); setFormError('') }
  const toggleNoErp = (v) => { setNoErp(v); if (v) setSelErps(new Set()); setFormError('') }
  const toggleNoCrm = (v) => { setNoCrm(v); if (v) setSelCrms(new Set()); setFormError('') }
  const toggleMp = (id) => { setSelMps(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n }); setFormError('') }

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

  // Generate one listing for a pair x marketplace. Used by the batch loop and per-card Regenerate.
  const generateOne = async (pair, mp) => {
    const g = mp.guidelines || {}
    const sysLine = pair.erp && pair.crm ? `connecting ${pair.erp} (ERP) to ${pair.crm}` : pair.erp ? `for ${pair.erp} ERP users` : pair.crm ? `connecting to ${pair.crm}` : 'as a standalone integration'

    // Only enforce numbers the marketplace actually states — never invent a limit
    const num = (v) => (typeof v === 'number' && v > 0) ? v : null
    const tMax = num(g.maxTitle), sMax = num(g.maxShortDesc), lMax = num(g.maxDesc)
    const tMin = num(g.minTitle), sMin = num(g.minShortDesc), lMin = num(g.minDesc)
    const fMax = num(g.maxFeatures), fMin = num(g.minFeatures), flMax = num(g.maxFeatureLen), tagMax = num(g.maxTags), tagMin = num(g.minTags)

    const clause = (min, max, unit) => {
      if (min && max) return `between ${min} and ${max} ${unit}`
      if (max) return `no more than ${max} ${unit}`
      if (min) return `at least ${min} ${unit}`
      return null
    }
    const titleC = clause(tMin, tMax, 'characters')
    const shortC = clause(sMin, sMax, 'characters')
    const longC = clause(lMin, lMax, 'characters')
    const featCountC = clause(fMin, fMax, 'features')

    const guidelineLines = [
      `- Title: ${titleC ? `MUST be ${titleC}. ` : ''}Do not use colons or semicolons in the title.`,
      `- Short description: ${shortC ? `MUST be ${shortC}.` : 'keep it to roughly one clear sentence.'}`,
      `- Long description: ${longC ? `MUST be ${longC}. This is a HARD requirement.` : 'a few clear paragraphs; do not pad or repeat.'}`,
      `- Features: ${featCountC ? `provide ${featCountC}` : 'provide 3-5 features'}${flMax ? `, each no more than ${flMax} characters` : ''}`,
      tagMax || tagMin ? `- Tags: ${clause(tagMin, tagMax, 'tags')} — relevant search keywords describing what the integration does, which ERPs/CRMs it connects, and which industries it serves (e.g. "ERP integration", "${pair.erp || 'ERP'}", "${pair.crm || 'CRM'}", "data sync", "automation"). REQUIRED — never leave empty.`
        : `- Tags: provide 5-10 relevant search keywords describing what the integration does, which ERPs/CRMs it connects, and which industries it serves (e.g. "ERP integration", "${pair.erp || 'ERP'}", "${pair.crm || 'CRM'}", "data sync", "automation"). REQUIRED — never leave empty.`,
      `- Tone: ${g.tone || 'factual and descriptive'}`,
      `- Rules: ${(g.rules || []).join(' | ')}`
    ].filter(Boolean).join('\n')

    // Features: if the marketplace has a stated format, honour it exactly.
    // If not, default to the most common marketplace structure: {name, description} objects,
    // since flat strings produce unusable paragraph blobs that require heavy manual editing.
    const hasFeatureFormat = !!(g.featureRequirements && g.featureRequirements.trim())
    const featureFormatBlock = hasFeatureFormat
      ? `\n${mp.name.toUpperCase()} FEATURE FORMAT (follow this EXACTLY for every item in the features array):\n${g.featureRequirements}\nEach feature you write must match this required structure.\n`
      : `\nFEATURE FORMAT: Return each feature as a JSON object. You MUST generate the "name" field FIRST, then the "description". Follow this process for each feature:
STEP 1 — Write the feature NAME: a short, specific title (3-7 words) that clearly names what the feature IS. Think of it like a product feature heading. Examples: "Automated Sales Order Sync", "Bi-directional Contact Updates", "Real-time Invoice Visibility", "Configurable Sync Frequency", "Pre-built ERP Templates".
STEP 2 — Write the DESCRIPTION: 2-3 sentences explaining what that named feature does and how it helps the customer. Reference the specific ERP (${pair.erp || 'the ERP'}) and CRM (${pair.crm || 'the CRM'}) by name.
The name and description must describe the SAME feature. The description should expand on the name — not introduce a new topic.
Example output: {"name":"Automated Sales Order Sync","description":"Sales orders created in ${pair.crm || 'the CRM'} are automatically written to ${pair.erp || 'the ERP'} within minutes. This eliminates manual re-entry between systems and ensures fulfillment teams always have current order data."}\n`

    // Curate the marketplace's checklist into a clean section plan:
    // near-duplicates collapse into one bucket each, items duplicating core fields are dropped,
    // trivially derivable items are auto-filled without an AI call.
    const rawTextSections = (g.nextSteps || []).filter(s => !isVisualStep(s) && !isExternalStep(s))
    const { curated, passthrough } = curateSections(rawTextSections)
    const aiSections = [...curated.filter(c => !c.autofill), ...passthrough]

    const appInfoBlock = `APP INFO:
- App: ${appName} ${sysLine}
- Version: ${appVersion || 'current'}
- Description: ${appDesc}
${pair.erp ? `- ERP: ${pair.erp}` : ''}
${pair.crm ? `- CRM/App: ${pair.crm}` : ''}
- Company: Commercient`

    // Pull only the knowledge-base blocks relevant to THIS listing (product name, app description,
    // ERP/CRM names) instead of injecting the entire knowledge base into every call — keeps each
    // request small and fast while still grounding every fact.
    const blocks = knowledgeBlocksRef.current
    const coreQuery = `${appName} ${appDesc} ${pair.erp || ''} ${pair.crm || ''} ${mp.name}`
    const coreKnowledge = selectKnowledge(blocks, coreQuery, 3500)
    const buildKnowledgeBlock = (kb) => kb
      ? `PRODUCT KNOWLEDGE BASE EXCERPT (the ONLY source of truth for product-specific facts):
${kb}

FACTUAL ACCURACY RULES:
- Any specific factual claim about the product — pricing, plan names, synced objects and directions, setup steps, support channels, languages, certifications — MUST come from the PRODUCT KNOWLEDGE BASE EXCERPT above.
- If a required piece of information is NOT in the excerpt, write the placeholder [CONFIRM: <what is needed>] instead of inventing it. Example: [CONFIRM: pricing plans].
- General, well-known facts about ${pair.erp || ''} ${pair.crm || ''} platforms themselves may be described from general knowledge, but nothing product-specific may be invented.`
      : `FACTUAL ACCURACY RULES:
- No product knowledge base is configured. Do NOT invent any specific product facts.
- For pricing, plan names, exact synced-object lists, setup steps, support channels, or languages, write the placeholder [CONFIRM: <what is needed>] instead of inventing details. Example: [CONFIRM: pricing plans].
- Describe the integration's purpose and typical capabilities in general, accurate terms only.`
    const knowledgeBlock = buildKnowledgeBlock(coreKnowledge)

    const toneBlock = `TONE AND LANGUAGE RULES:
- Do NOT use any sales or marketing language.
- Do NOT use phrases like "get started today", "work harder", "unlock", "supercharge", "revolutionize", "game-changing", "seamless", or any calls to action.
- Write in a factual, descriptive, technical tone.
- Focus on what the integration does, how it works, and what data it syncs.
- Describe capabilities, not promises. State facts, not pitches.
- ALL text must be PLAIN TEXT ONLY — no HTML tags, no markdown, no heading syntax.`

    const corePrompt = `You are an expert app marketplace copywriter for Commercient, specialists in ERP/CRM integration software.

Generate a fully compliant listing for "${appName}" ${sysLine}, for the ${mp.name} marketplace.

${appInfoBlock}

${knowledgeBlock}

${mp.name.toUpperCase()} GUIDELINES:
${guidelineLines}
${featureFormatBlock}
CRITICAL FORMATTING RULES:
- Write the long description as natural flowing paragraphs separated by blank lines.
${lMax ? `- The long description MUST NOT exceed ${lMax} characters. If approaching the limit, write less.` : `- Keep the long description under 2500 characters — thorough but not padded.`}
${lMin ? `- The long description MUST be at least ${lMin} characters of substantive content (no filler or repetition to pad length).` : ''}
${tMax ? `- The title MUST NOT exceed ${tMax} characters and must NOT contain colons or semicolons.` : `- The title must NOT contain colons or semicolons.`}
${tMin ? `- The title MUST be at least ${tMin} characters.` : ''}
${sMax ? `- The short description MUST NOT exceed ${sMax} characters.` : ''}
${sMin ? `- The short description MUST be at least ${sMin} characters.` : ''}

${toneBlock}

Use your knowledge of both platforms to write an accurate factual listing. Return ONLY valid JSON no preamble:
{"title":"","shortDescription":"","longDescription":"","features":[],"tags":[],"complianceNotes":[]}`

    const callGenerate = async (prompt, maxTokens) => {
      if (cancelRef.current) throw new Error('__cancelled__')
      const resp = await fetch('/.netlify/functions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, maxTokens }),
        signal: abortRef.current?.signal
      })
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `Server error (${resp.status})` }))
        throw new Error(err.error || `Server error (${resp.status})`)
      }
      return resp.json()
    }

    // Call 1: the core listing
    const data = await callGenerate(corePrompt, 1100)

    // Calls 2+: curated sections in batches of 3, each with its own topic-scoped knowledge excerpt
    const sections = []
    for (let b = 0; b < aiSections.length; b += 3) {
      if (cancelRef.current) throw new Error('__cancelled__')
      const batch = aiSections.slice(b, b + 3)
      const hasPricing = batch.some(s => s.id === 'pricing')
      const batchQuery = `${appName} ${pair.erp || ''} ${pair.crm || ''} ${batch.map(s => `${s.label || ''} ${s.instruction}`).join(' ')}`
      const batchKnowledge = selectKnowledge(blocks, batchQuery, 2200)
      const sectionKnowledgeBlock = buildKnowledgeBlock(batchKnowledge)
      const sectionPrompt = `You are an expert app marketplace copywriter for Commercient, writing content for the "${appName}" listing on the ${mp.name} marketplace.

${appInfoBlock}

${sectionKnowledgeBlock}

${toneBlock}

The generated listing title is: ${data.title || appName}
The short description is: ${data.shortDescription || appDesc}

${mp.name} requires the following additional listing content. Write ONE section per numbered item, using the given section name as the label EXACTLY (do not invent extra sections):
${batch.map((s, i) => `${i + 1}. ${s.label ? `${s.label} — ` : ''}${s.instruction}`).join('\n')}

IMPORTANT: Each "content" value MUST be a single plain-text string. For lists (e.g. pricing plans, feature lists), write them as plain text with line breaks between items — NEVER as nested objects or arrays.
${hasPricing ? `PRICING RULE: Use ONLY the exact dollar amounts and plan names from the PRODUCT KNOWLEDGE BASE EXCERPT above. Every price you write must appear verbatim in the excerpt. If a required figure is not in the excerpt, write [CONFIRM: <figure needed>]. Never estimate, round differently, or invent a price.` : ''}

Return ONLY valid JSON no preamble:
{"sections":[{"label":"<the given section name>","content":"<the generated content as one plain-text string>"}]}`
      try {
        const res = await callGenerate(sectionPrompt, 900)
        if (Array.isArray(res.sections)) {
          sections.push(...res.sections
            .filter(s => s && s.label)
            .map(s => ({ label: String(s.label), content: sectionContentToString(s.content) })))
        }
      } catch (e) {
        if (cancelRef.current || e.name === 'AbortError' || e.message === '__cancelled__') throw e
        sections.push({ label: `Sections ${b + 1}-${b + batch.length} (failed)`, content: `Generation failed: ${e.message}. Use Regenerate to retry.` })
      }
    }

    // Auto-filled sections (no AI call needed) + generated sections, then a final dedup pass
    const autofilled = curated.filter(c => c.autofill).map(c => {
      if (c.id === 'urlPath') return { label: 'URL path', content: slugify(data.title || appName) }
      return null
    }).filter(Boolean)
    data.additionalSections = dedupeSections([...sections, ...autofilled])

    if (data.longDescription) {
      data.longDescription = data.longDescription.replace(/<[^>]*>/g, '').replace(/#{1,6}\s/g, '').replace(/\*\*/g, '').trim()
    }
    if (data.shortDescription) {
      data.shortDescription = data.shortDescription.replace(/<[^>]*>/g, '').trim()
    }
    if (data.title) {
      data.title = data.title.replace(/<[^>]*>/g, '').trim()
    }

    // Enforce marketplace limits so every listing is guaranteed to fit before it's shown
    const notes = Array.isArray(data.complianceNotes) ? [...data.complianceNotes] : []

    const t = fitText(data.title, tMax); data.title = t.text
    if (t.trimmed) notes.push(`Title auto-trimmed to fit the ${tMax}-character limit.`)

    const s = fitText(data.shortDescription, sMax); data.shortDescription = s.text
    if (s.trimmed) notes.push(`Short description auto-trimmed to fit the ${sMax}-character limit.`)

    const l = fitText(data.longDescription, lMax); data.longDescription = l.text
    if (l.trimmed) notes.push(`Long description auto-trimmed to fit the ${lMax}-character limit.`)

    // Minimums can't be auto-padded without filler (which marketplaces reject), so flag if unmet
    const checkMin = (fieldLabel, val, min) => {
      if (min && (val || '').length < min) notes.push(`${fieldLabel} is ${(val || '').length}/${min} characters — below the required minimum. Add more detail before submitting.`)
    }
    checkMin('Title', data.title, tMin)
    checkMin('Short description', data.shortDescription, sMin)
    checkMin('Long description', data.longDescription, lMin)

    if (Array.isArray(data.features)) {
      // Normalize features and collect descriptions
      let feats = data.features.map(f => {
        if (f && typeof f === 'object' && (f.name || f.description)) {
          const desc = fitText(f.description || '', flMax)
          return { name: (f.name || '').trim(), description: desc.text }
        }
        const text = fitText(featureToString(f), flMax).text
        return text ? { name: '', description: text } : null
      }).filter(Boolean)

      // Check which features need names (missing or looks like the description start)
      const needsName = feats.map((f, i) => {
        if (!f.name) return true
        const descStart = f.description.toLowerCase().slice(0, f.name.length + 10)
        return descStart.startsWith(f.name.toLowerCase())
      })

      // If any features need names, make ONE small AI call to name them all at once.
      // This is fast (~2s, ~200 tokens out) and produces far better titles than regex extraction.
      if (needsName.some(Boolean) && feats.length > 0) {
        try {
          const namingPrompt = `You are writing short feature titles for a marketplace app listing.

For each feature description below, write a concise, specific title (3-7 words) that names what the feature IS. Think of it as a product feature heading a customer would scan.

Good titles: "Automated Sales Order Sync", "Real-time Invoice Visibility", "Bi-directional Contact Updates", "Cloud-hosted Integration", "Pre-built Data Templates", "Configurable Sync Frequency", "Warehouse Inventory Tracking"
Bad titles: "Data is synced" (too vague), "The integration runs on a schedule" (a sentence, not a title), "Feature 1" (meaningless)

${feats.map((f, i) => `${i + 1}. ${f.description.slice(0, 300)}`).join('\n')}

Return ONLY valid JSON — an array of strings, one title per feature, in the same order:
["title for 1","title for 2",...]`

          const nameResult = await callGenerate(namingPrompt, 300)
          // nameResult should be an array of strings, or have a titles/names field
          let names = []
          if (Array.isArray(nameResult)) {
            names = nameResult
          } else if (Array.isArray(nameResult.titles)) {
            names = nameResult.titles
          } else if (Array.isArray(nameResult.names)) {
            names = nameResult.names
          } else {
            // Try to find an array in the response
            const firstArray = Object.values(nameResult).find(v => Array.isArray(v))
            if (firstArray) names = firstArray
          }

          feats.forEach((f, i) => {
            if (needsName[i] && names[i] && typeof names[i] === 'string' && names[i].trim()) {
              f.name = names[i].trim()
            }
          })
        } catch (e) {
          // Naming call failed — fall back to regex extraction so features still have names
          feats.forEach((f, i) => {
            if (needsName[i]) f.name = extractFeatureName(f.description)
          })
        }
      }

      if (fMax && feats.length > fMax) {
        feats = feats.slice(0, fMax)
        notes.push(`Trimmed to the ${fMax} allowed features.`)
      }
      if (fMin && feats.length < fMin) {
        notes.push(`Only ${feats.length} features generated — at least ${fMin} required.`)
      }
      data.features = feats
    }

    if (tagMax && Array.isArray(data.tags) && data.tags.length > tagMax) {
      data.tags = data.tags.slice(0, tagMax)
      notes.push(`Trimmed to the ${tagMax} allowed tags.`)
    }
    if (tagMin && Array.isArray(data.tags) && data.tags.length < tagMin) {
      notes.push(`Only ${data.tags.length} tags — at least ${tagMin} required.`)
    }

    data.complianceNotes = notes
    return data
  }

  const generate = async () => {
    if (!appName.trim()) { setFormError('Enter an app name before generating.'); return }
    if (!appDesc.trim()) { setFormError('Enter a one-line description before generating.'); return }
    if (!currentPairs.length) { setFormError('Select at least one ERP or CRM/App, or check standalone.'); return }
    const mps = marketplaces.filter(m => selMps.has(m.id))
    if (!mps.length) { setFormError('Select at least one marketplace.'); return }

    const total = currentPairs.length * mps.length
    if (total > 15 && !window.confirm(`This will generate ${total} listings and may take several minutes. Continue?`)) return

    setFormError('')
    setGenerating(true)
    setTab('output')
    cancelRef.current = false
    abortRef.current = new AbortController()
    await loadKnowledge()
    const newResults = { ...generatedResults }
    let done = 0

    setGeneratedPairs(currentPairs)
    setGeneratedMpIds([...selMps])

    // Flatten into a job queue and process several listings concurrently (instead of one at a time).
    // Each listing is still several small, fast calls — running 3 listings in parallel cuts total
    // batch time roughly 3x without making any single call larger or slower.
    const jobs = []
    for (const pair of currentPairs) {
      for (const mp of mps) {
        jobs.push({ pair, mp, key: `${pair.label}||${mp.id}` })
      }
    }
    const CONCURRENCY = 3
    let nextIndex = 0

    const worker = async () => {
      while (true) {
        if (cancelRef.current) return
        const i = nextIndex++
        if (i >= jobs.length) return
        const { pair, mp, key } = jobs[i]
        setProgress(`Generating ${pair.label} \u00D7 ${mp.name}\u2026 (${done}/${total})`)
        try {
          const data = await generateOne(pair, mp)
          newResults[key] = data
        } catch (e) {
          if (cancelRef.current || e.name === 'AbortError' || e.message === '__cancelled__') return
          newResults[key] = { error: true, message: e.message }
        }
        done++
        setGeneratedResults({ ...newResults })
        setProgressPct(Math.round(done / total * 100))
        setProgress(`Generating\u2026 (${done}/${total})`)
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, () => worker()))

    setGenerating(false)
    setProgress('')
    setProgressPct(0)
  }

  const handleRegenerate = async (key) => {
    const [label, mpId] = key.split('||')
    const pool = generatedPairs.length > 0 ? generatedPairs : currentPairs
    const pair = pool.find(p => p.label === label)
    const mp = marketplaces.find(m => m.id === mpId)
    if (!pair || !mp) return
    cancelRef.current = false
    abortRef.current = new AbortController()
    await loadKnowledge()
    setGeneratedResults(prev => ({ ...prev, [key]: { pending: true } }))
    try {
      const data = await generateOne(pair, mp)
      setGeneratedResults(prev => ({ ...prev, [key]: data }))
    } catch (e) {
      setGeneratedResults(prev => ({ ...prev, [key]: { error: true, message: e.message } }))
    }
  }

  const resultCount = Object.keys(generatedResults).length
  const displayPairs = generatedPairs.length > 0 ? generatedPairs : currentPairs
  const displayMpIds = generatedMpIds.length > 0 ? generatedMpIds : [...selMps]
  const displayMps = marketplaces.filter(m => displayMpIds.includes(m.id))
  const visiblePairs = showAllPairs ? currentPairs : currentPairs.slice(0, 12)

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
              <div className="form-group"><label>App name</label><input value={appName} onChange={e => { setAppName(e.target.value); setFormError('') }} placeholder="e.g. Commercient Sync" /></div>
              <div className="form-group"><label>Version (optional)</label><input value={appVersion} onChange={e => setAppVersion(e.target.value)} placeholder="e.g. 2.1" /></div>
            </div>
            <div className="form-group">
              <label>One-line description &mdash; applies to all listings</label>
              <textarea value={appDesc} onChange={e => { setAppDesc(e.target.value); setFormError('') }} placeholder="e.g. Syncs customer accounts, orders, invoices and inventory between ERP and CRM systems in real time, eliminating manual data entry." style={{ minHeight: 72 }} />
            </div>
          </div>
          <div className="card">
            <div className="card-title">Select systems to connect</div>
            <div className="form-grid">
              <SystemPicker type="erp" selected={selErps} onToggle={toggleErp} noSystem={noErp} onToggleNone={toggleNoErp} />
              <SystemPicker type="crm" selected={selCrms} onToggle={toggleCrm} noSystem={noCrm} onToggleNone={toggleNoCrm} />
            </div>
            {currentPairs.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10, alignItems: 'center' }}>
                {visiblePairs.map(p => <span key={p.label} style={{ padding: '3px 10px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>{p.label}</span>)}
                {currentPairs.length > 12 && (
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={() => setShowAllPairs(s => !s)}>
                    {showAllPairs ? 'Show fewer' : `+${currentPairs.length - 12} more`}
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="card">
            <div className="card-title">Target marketplaces</div>
            {marketplaces.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No marketplaces yet — click <strong>Add marketplace</strong> in the sidebar to add one with its guideline URLs.</p>
            ) : (
              <div className="chip-list">
                {marketplaces.map(mp => (
                  <div key={mp.id} className={`chip ${selMps.has(mp.id) ? 'selected' : ''}`} onClick={() => toggleMp(mp.id)}>
                    <span className="chip-dot" style={{ background: mp.color }} />{mp.name}
                  </div>
                ))}
              </div>
            )}
            <p style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 10 }}>Each listing follows that marketplace's character limits and content rules automatically.</p>
          </div>
          {formError && (
            <div style={{ background: 'var(--red-bg)', color: 'var(--red)', padding: '8px 12px', borderRadius: 'var(--radius)', fontSize: 12, marginBottom: 12 }}>
              {formError}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-primary" onClick={generate} disabled={generating}>
              <Sparkles size={14} />
              {generating ? 'Generating\u2026' : `Generate ${currentPairs.length * selMps.size} listing${currentPairs.length * selMps.size !== 1 ? 's' : ''}`}
            </button>
            {currentPairs.length > 0 && selMps.size > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{currentPairs.length} pair{currentPairs.length !== 1 ? 's' : ''} × {selMps.size} marketplace{selMps.size !== 1 ? 's' : ''}</span>}
          </div>
        </>
      )}
      {tab === 'output' && (
        <>
          {generating && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div className="loading-row" style={{ margin: 0 }}><div className="spinner" />{progress}</div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => { cancelRef.current = true; abortRef.current?.abort() }}>
                  <XCircle size={12} /> Stop
                </button>
              </div>
              <div style={{ height: 4, background: 'var(--bg-surface)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--accent)', borderRadius: 4, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}
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
                if (r.pending) return (
                  <div key={mp.id} className="result-card" style={{ padding: 14, fontSize: 13, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="spinner" /> Regenerating {mp.name}…
                  </div>
                )
                if (r.error) return (
                  <div key={mp.id} className="result-card" style={{ padding: 14, fontSize: 13, color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span>{mp.name}: {r.message || 'Generation failed'}</span>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleRegenerate(key)}><RefreshCw size={12} /> Retry</button>
                  </div>
                )
                return <ResultCard key={mp.id} marketplace={mp} result={r} onSave={onSaveVersion} onDelete={handleDeleteResult} onRegenerate={handleRegenerate} resultKey={key} />
              })}
            </div>
          ))}
        </>
      )}
    </div>
  )
}