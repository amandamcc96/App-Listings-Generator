import { useState } from 'react'
import Sidebar from './components/Sidebar'
import AddMarketplaceModal from './components/AddMarketplaceModal'
import GeneratePage from './pages/GeneratePage'
import GuidelinesPage from './pages/GuidelinesPage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'
import { DEFAULT_MARKETPLACES } from './data/marketplaces'
import { useLocalStorage } from './hooks/useLocalStorage'

const PAGE_TITLES = {
  generate: 'Generate listings',
  guidelines: 'Guidelines library',
  history: 'Version history',
  settings: 'Settings'
}

export default function App() {
  const [view, setView] = useState('generate')
  const [showAddModal, setShowAddModal] = useState(false)
  const [customMarketplaces, setCustomMarketplaces] = useLocalStorage('custom_marketplaces', [])
  const [history, setHistory] = useLocalStorage('listing_history', [])

  const allMarketplaces = [...DEFAULT_MARKETPLACES, ...customMarketplaces]

  const handleAddMarketplace = (mp) => {
    setCustomMarketplaces(prev => [...prev, mp])
  }

  const handleDeleteCustom = (id) => {
    setCustomMarketplaces(prev => prev.filter(m => m.id !== id))
  }

  const handleSaveVersion = (marketplaceId, listing) => {
    const mp = allMarketplaces.find(m => m.id === marketplaceId)
    const entry = {
      id: Date.now().toString(),
      appName: listing.title || 'Untitled',
      marketplaceId,
      marketplaceName: mp?.name || marketplaceId,
      version: listing.version,
      savedAt: new Date().toISOString(),
      listing
    }
    setHistory(prev => [...prev, entry])
    // small toast-like feedback
    const el = document.createElement('div')
    el.textContent = `Saved to version history`
    Object.assign(el.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '999',
      background: '#34d399', color: '#fff', padding: '8px 14px',
      borderRadius: '8px', fontSize: '13px', fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)', transition: 'opacity 0.3s'
    })
    document.body.appendChild(el)
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300) }, 2000)
  }

  const handleDeleteHistory = (id) => {
    setHistory(prev => prev.filter(e => e.id !== id))
  }

  const handleClearHistory = () => {
    setHistory([])
  }

  const handleExportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `listing-history-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImportHistory = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (Array.isArray(data)) {
          setHistory(prev => {
            const existing = new Set(prev.map(h => h.id))
            const newItems = data.filter(d => !existing.has(d.id))
            return [...prev, ...newItems]
          })
        }
      } catch {
        alert('Invalid file format.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="app-shell">
      <Sidebar
        view={view}
        setView={setView}
        onAddMarketplace={() => setShowAddModal(true)}
        savedCount={history.length}
      />

      <div className="main">
        <div className="topbar">
          <h2>{PAGE_TITLES[view]}</h2>
          <div className="topbar-actions">
            {view === 'generate' && (
              <span className="badge badge-purple">AI-powered · {allMarketplaces.length} marketplaces</span>
            )}
          </div>
        </div>

        {view === 'generate' && (
          <GeneratePage
            marketplaces={allMarketplaces}
            onSaveVersion={handleSaveVersion}
          />
        )}
        {view === 'guidelines' && (
          <GuidelinesPage marketplaces={allMarketplaces} />
        )}
        {view === 'history' && (
          <HistoryPage
            history={history}
            onDelete={handleDeleteHistory}
            onExport={handleExportHistory}
            onImport={handleImportHistory}
          />
        )}
        {view === 'settings' && (
          <SettingsPage
            customMarketplaces={customMarketplaces}
            onDeleteCustom={handleDeleteCustom}
            onClearHistory={handleClearHistory}
          />
        )}
      </div>

      {showAddModal && (
        <AddMarketplaceModal
          onSave={handleAddMarketplace}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}
