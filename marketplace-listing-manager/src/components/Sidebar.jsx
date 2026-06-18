import { Sparkles, BookOpen, Clock, Plus, Settings, ChevronRight } from 'lucide-react'

const NAV = [
  { id: 'generate', label: 'Generate listings', icon: Sparkles },
  { id: 'guidelines', label: 'Guidelines library', icon: BookOpen },
  { id: 'history', label: 'Version history', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export default function Sidebar({ view, setView, onAddMarketplace, savedCount }) {
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>Listing Manager</h1>
        <p>ERP &amp; CRM integrations</p>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-label">Workspace</div>
        {NAV.map(item => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => setView(item.id)}
            >
              <Icon size={15} />
              {item.label}
              {item.id === 'history' && savedCount > 0 && (
                <span className="badge badge-purple" style={{ marginLeft: 'auto', fontSize: '10px' }}>
                  {savedCount}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <div className="sidebar-footer">
        <button className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={onAddMarketplace}>
          <Plus size={13} />
          Add marketplace
        </button>
      </div>
    </div>
  )
}
