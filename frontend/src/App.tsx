import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPortal from './pages/AuthPortal'
import OfflineSync from './pages/OfflineSync'
import ConductorPlaceholder from './pages/ConductorPlaceholder'

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPortal />} />
        <Route path="/register" element={<AuthPortal />} />
        <Route path="/conductor/sync" element={<OfflineSync />} />
        <Route path="/conductor/dashboard" element={<ConductorPlaceholder title="Dashboard" />} />
        <Route path="/conductor/scanner" element={<ConductorPlaceholder title="Scanner" />} />
        <Route path="/conductor/profile" element={<ConductorPlaceholder title="Profile" />} />
      </Routes>
    </Router>
  )
}

export default App
