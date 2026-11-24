import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPortal from './pages/AuthPortal'
import PassengerQRBoarding from './pages/PassengerQRBoarding'
import ConductorScanner from './pages/ConductorScanner'
import SettlementSummary from './pages/SettlementSummary'
import AdminReportsManagement from './pages/AdminReportsManagement'
import OfflineSync from './pages/OfflineSync'
import ConductorPlaceholder from './pages/ConductorPlaceholder'

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPortal />} />
        <Route path="/register" element={<AuthPortal />} />
        <Route path="/passenger/scan-qr" element={<PassengerQRBoarding />} />
        <Route path="/passenger/boarding" element={<PassengerQRBoarding />} />
        <Route path="/conductor/scanner" element={<ConductorScanner />} />
        <Route path="/conductor/sync" element={<OfflineSync />} />
        <Route path="/conductor/dashboard" element={<ConductorPlaceholder title="Dashboard" />} />
        <Route path="/conductor/profile" element={<ConductorPlaceholder title="Profile" />} />
        <Route path="/owner/settlements" element={<SettlementSummary />} />
        <Route path="/settlements" element={<SettlementSummary />} />
        <Route path="/admin/reports" element={<AdminReportsManagement />} />
        <Route path="/admin/management" element={<AdminReportsManagement />} />
        <Route path="/admin" element={<AdminReportsManagement />} />
      </Routes>
    </Router>
  )
}

export default App
