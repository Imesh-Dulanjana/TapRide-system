import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPortal from './pages/AuthPortal'
import ConductorScanner from './pages/ConductorScanner'

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPortal />} />
        <Route path="/register" element={<AuthPortal />} />
        <Route path="/conductor/scanner" element={<ConductorScanner />} />
      </Routes>
    </Router>
  )
}

export default App
