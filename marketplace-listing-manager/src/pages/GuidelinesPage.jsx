import { ExternalLink } from 'lucide-react'

export default function GuidelinesPage({ marketplaces }) {
  return (
    <div className="page">
      <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        Character limits and content rules embedded into every generated listing. These constraints are automatically applied so your listings won't be rejected.
      </p>
      <div style={{ display: 'grid', gap: 14 }}>
        {marketplaces.map(mp => {
          const g = mp.guidelines
          return (
            <div className="card" key={mp.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div className="mp-badge" style={{ background: mp.color, color: mp.textColor, width: 34, height: 34, borderRadius: 8, fontSize: 12 }}>
                  {mp.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{mp.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{g.tone}</div>
                </div>
                {mp.publishDocs && (
                  <a href={mp.publishDocs} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                    <ExternalLink size={12} /> Docs
                  </a>
                )}
              </div>

              <div className="limit-bar">
                <span className="limit-pill badge badge-purple">Title: {g.maxTitle} chars</span>
                <span className="limit-pill badge badge-purple">Short desc: {g.maxShortDesc} chars</span>
                <span className="limit-pill badge badge-purple">Long desc: {g.maxDesc} chars</span>
                <span className="limit-pill badge badge-purple">Features: {g.maxFeatures}</span>
                <span className="limit-pill badge badge-purple">Tags: {g.maxTags}</span>
              </div>

              <div className="guidelines-box">
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Content rules &amp; restrictions
                </p>
                <ul>
                  {g.rules.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
