import { TourProvider } from './context/TourContext'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { Main } from './components/Layout/Main'

function App() {
  return (
    <TourProvider>
      <div className="app-container">
        <div className="app-body">
          <Sidebar />
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
