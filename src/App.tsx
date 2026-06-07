import { useState } from 'react'
import { TourProvider } from './context/TourContext'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { Main } from './components/Layout/Main'
import { Menu } from 'lucide-react'

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <TourProvider>
      <div className="app-container">
        {/* 移动端汉堡按钮 —— 侧栏关闭时显示，打开后隐藏（用 ✕ 关） */}
        {!mobileMenuOpen && (
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="打开菜单"
          >
            <Menu className="w-5 h-5" />
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
  )
}

export default App
