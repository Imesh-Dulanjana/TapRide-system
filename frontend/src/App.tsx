import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPortal from './pages/AuthPortal'
import SettlementSummary from './pages/SettlementSummary'

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPortal />} />
        <Route path="/register" element={<AuthPortal />} />
        <Route path="/owner/settlements" element={<SettlementSummary />} />
        <Route path="/settlements" element={<SettlementSummary />} />
      </Routes>
    </Router>
  )
}

export default App
