import { useState } from 'react'
import { IconContext, List } from '@phosphor-icons/react'
import { TourProvider } from './context/TourContext'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { Main } from './components/Layout/Main'

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <IconContext.Provider
      value={{ size: 16, weight: 'duotone', color: 'currentColor', mirrored: false }}
    >
      <TourProvider>
        <div className="app-container">
          {!mobileMenuOpen && (
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="打开菜单"
            >
              <List size={20} />
            </button>
          )}

          <div className="app-body">
            <Sidebar
              mobileMenuOpen={mobileMenuOpen}
              onMobileMenuClose={closeMobileMenu}
            />
            <div className="main-column">
              <Header />
              <Main />
            </div>
          </div>
        </div>
      </TourProvider>
    </IconContext.Provider>
  )
}

export default App