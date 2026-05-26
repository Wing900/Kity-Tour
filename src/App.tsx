import { TourProvider } from './context/TourContext'
import { Header } from './components/Layout/Header'
import { Sidebar } from './components/Layout/Sidebar'
import { Main } from './components/Layout/Main'

function App() {
  return (
    <TourProvider>
      <div className="app-container">
        <Header />
        <div className="app-body">
          <Sidebar />
          <Main />
        </div>
      </div>
    </TourProvider>
  )
}

export default App
