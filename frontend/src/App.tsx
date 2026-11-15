import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import AuthPortal from './pages/AuthPortal'
import AdminReportsManagement from './pages/AdminReportsManagement'

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPortal />} />
        <Route path="/register" element={<AuthPortal />} />
        <Route path="/admin/reports" element={<AdminReportsManagement />} />
        <Route path="/admin/management" element={<AdminReportsManagement />} />
        <Route path="/admin" element={<AdminReportsManagement />} />
      </Routes>
    </Router>
  )
}

export default App
