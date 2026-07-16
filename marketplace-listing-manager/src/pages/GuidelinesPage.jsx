import { useState } from 'react'
import { ExternalLink, Image, CheckCircle } from 'lucide-react'

// Format a min/max pair honestly: "50 max", "160 min", "160–3000", or "no limit stated"
function limitText(min, max, unit) {
  const hasMin = typeof min === 'number' && min > 0
  const hasMax = typeof max === 'number' && max > 0
  if (hasMin && hasMax) return `${min}\u2013${max} ${unit}`
  if (hasMax) return `${max} ${unit} max`
  if (hasMin) return `${min} ${unit} min`
  return 'no limit stated'
}

function SpecRow({ label, value }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.6, marginBottom: 6 }}>
      <span style={{ fontWeight: 600, color: 'var(--text-muted)', flexShrink: 0, minWidth: 90 }}>{label}</span>
      <span style={{ color: 'var(--text-muted)' }}>{value}</span>
    </div>
  )
}

function MpLogo({ mp, size = 34, radius = 8, fontSize = 12 }) {
  const [imgFailed, setImgFailed] = useState(false)
  if (mp.logoDomain && !imgFailed) {
    return (
      <div className="mp-badge" style={{ background: '#fff', width: size, height: size, borderRadius: radius, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 3 }}>
        <img
          src={`https://logo.clearbit.com/${mp.logoDomain}`}
          alt={mp.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={() => setImgFailed(true)}
        />
      </div>
    )
  }
  return (
    <div className="mp-badge" style={{ background: mp.color, color: mp.textColor, width: size, height: size, borderRadius: radius, fontSize }}>
      {mp.icon}
    </div>
  )
}

export default function GuidelinesPage({ marketplaces }) {
  if (!marketplaces || marketplaces.length === 0) {
    return (
      <div className="page">
        <div className="empty-state">
          <div className="empty-state-icon">{'\u2726'}</div>
          <h3>No marketplaces yet</h3>
          <p>Click <strong>Add marketplace</strong> in the sidebar to add one with its guideline URLs.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Character limits and content rules embedded into every generated listing. These constraints are automatically applied so your listings won't be rejected.
      </p>
      <div style={{ display: 'grid', gap: 14 }}>
        {marketplaces.map(mp => {
          const g = mp.guidelines || {}
          const lastScanned = g.lastScanned ? new Date(g.lastScanned).toLocaleDateString() : null
          return (
            <div className="card" key={mp.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <MpLogo mp={mp} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{mp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                    {g.tone || 'No tone guidance extracted'}
                    {lastScanned ? ` \u00B7 Last scanned ${lastScanned}` : ''}
                  </div>
                </div>
                {mp.publishDocs && (
                  <a href={mp.publishDocs} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                    <ExternalLink size={12} /> Docs
                  </a>
                )}
              </div>

              <div className="limit-bar">
                <span className="limit-pill badge badge-purple">Title: {limitText(g.minTitle, g.maxTitle, 'chars')}</span>
                <span className="limit-pill badge badge-purple">Short desc: {limitText(g.minShortDesc, g.maxShortDesc, 'chars')}</span>
                <span className="limit-pill badge badge-purple">Long desc: {limitText(g.minDesc, g.maxDesc, 'chars')}</span>
                <span className="limit-pill badge badge-purple">Features: {limitText(g.minFeatures, g.maxFeatures, '')}</span>
                <span className="limit-pill badge badge-purple">Tags: {limitText(g.minTags, g.maxTags, '')}</span>
              </div>

              {(g.featureRequirements || g.iconSpec || g.screenshotSpec || g.videoSpec) && (
                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '10px 12px', marginBottom: 12 }}>
                  <SpecRow label="Features" value={g.featureRequirements} />
                  <SpecRow label="Icon" value={g.iconSpec} />
                  <SpecRow label="Screenshots" value={g.screenshotSpec} />
                  <SpecRow label="Video" value={g.videoSpec} />
                </div>
              )}

              {(g.rules || []).length > 0 && (
                <div className="guidelines-box">
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                    Content rules &amp; restrictions ({(g.rules || []).length})
                  </p>
                  <ul>
                    {(g.rules || []).map((rule, i) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              {(g.nextSteps || []).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Image size={12} /> Assets &amp; submission checklist ({(g.nextSteps || []).length})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {(g.nextSteps || []).map((step, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                        <CheckCircle size={12} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-dim)' }} />
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}