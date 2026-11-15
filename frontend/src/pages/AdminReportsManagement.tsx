import React, { useState } from 'react'
import {
  LayoutDashboard,
  Radio,
  Users,
  Briefcase,
  Bus,
  UserCheck,
  ArrowLeftRight,
  FileText,
  DollarSign,
  BarChart3,
  Settings,
  Search,
  Bell,
  Download,
  ChevronDown,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react'

interface ReportRecord {
  id: string
  title: string
  generatedBy: string
  date: string
  format: 'PDF' | 'XLSX' | 'CSV'
  status: 'READY' | 'GENERATING' | 'FAILED'
  fileSize: string
  reportType: string
}

interface OperatorApproval {
  id: string
  name: string
  role: 'Bus Owner' | 'Conductor' | 'Fleet Operator'
  regNumber: string
  depot: string
  route: string
  submissionDate: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  nic: string
  contact: string
}

export const AdminReportsManagement: React.FC = () => {
  // Navigation / active view
  const [activeTab, setActiveTab] = useState<'reports' | 'approvals'>('reports')
  const [activeMenu, setActiveMenu] = useState<string>('Reports')

  // Search and filters
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedReportType, setSelectedReportType] = useState<string>('Revenue & Transactions')
  const [dateRange, setDateRange] = useState<string>('Aug 1, 2026 – Aug 29, 2026')
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'XLSX' | 'CSV'>('PDF')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generationFeedback, setGenerationFeedback] = useState<string | null>(null)

  // Notification modal
  const [showNotifications, setShowNotifications] = useState<boolean>(false)

  // Document modal for approvals
  const [selectedApproval, setSelectedApproval] = useState<OperatorApproval | null>(null)

  // Reports data
  const [reports, setReports] = useState<ReportRecord[]>([
    {
      id: 'REP-001',
      title: 'Daily Revenue Report',
      generatedBy: 'System Admin',
      date: 'Aug 29, 2026',
      format: 'PDF',
      status: 'READY',
      fileSize: '1.4 MB',
      reportType: 'Revenue & Transactions'
    },
    {
      id: 'REP-002',
      title: 'Settlement Summary',
      generatedBy: 'System Admin',
      date: 'Aug 28, 2026',
      format: 'PDF',
      status: 'READY',
      fileSize: '890 KB',
      reportType: 'Settlement & Payouts'
    },
    {
      id: 'REP-003',
      title: 'Fleet Performance Report',
      generatedBy: 'System Admin',
      date: 'Aug 28, 2026',
      format: 'XLSX',
      status: 'READY',
      fileSize: '2.1 MB',
      reportType: 'Fleet Operations'
    },
    {
      id: 'REP-004',
      title: 'Transaction Audit',
      generatedBy: 'System Admin',
      date: 'Aug 27, 2026',
      format: 'PDF',
      status: 'READY',
      fileSize: '3.6 MB',
      reportType: 'Revenue & Transactions'
    },
    {
      id: 'REP-005',
      title: 'Route 81 Conductor Log',
      generatedBy: 'System Admin',
      date: 'Aug 26, 2026',
      format: 'CSV',
      status: 'READY',
      fileSize: '540 KB',
      reportType: 'Operations'
    }
  ])

  // Operator Approvals data (NCP Anuradhapura - Polonnaruwa corridor)
  const [approvals, setApprovals] = useState<OperatorApproval[]>([
    {
      id: 'APP-8101',
      name: 'Sunil Wickramasinghe',
      role: 'Bus Owner',
      regNumber: 'NC-6284',
      depot: 'Anuradhapura Central Depot',
      route: 'Route 81 (Anuradhapura - Polonnaruwa)',
      submissionDate: 'Aug 28, 2026',
      status: 'PENDING',
      nic: '197812903841',
      contact: '+94 77 123 4567'
    },
    {
      id: 'APP-8102',
      name: 'Mahesh Bandara',
      role: 'Conductor',
      regNumber: 'COND-NCP-402',
      depot: 'Polonnaruwa Kaduruwela Depot',
      route: 'Route 81 (Kaduruwela - Anuradhapura)',
      submissionDate: 'Aug 27, 2026',
      status: 'PENDING',
      nic: '199234819022',
      contact: '+94 71 987 6543'
    },
    {
      id: 'APP-8103',
      name: 'Rajarata Express Logistics',
      role: 'Fleet Operator',
      regNumber: 'FLT-81-009',
      depot: 'Habarana Junction Terminal',
      route: 'Route 81 Corridor',
      submissionDate: 'Aug 26, 2026',
      status: 'PENDING',
      nic: 'PV00293819',
      contact: '+94 25 222 3456'
    }
  ])

  // Handle report generation
  const handleGenerateReport = () => {
    setIsGenerating(true)
    setGenerationFeedback(null)

    setTimeout(() => {
      const newReport: ReportRecord = {
        id: `REP-${String(reports.length + 1).padStart(3, '0')}`,
        title: `${selectedReportType} (${selectedFormat})`,
        generatedBy: 'System Admin',
        date: 'Aug 29, 2026',
        format: selectedFormat,
        status: 'READY',
        fileSize: selectedFormat === 'PDF' ? '1.8 MB' : selectedFormat === 'XLSX' ? '2.4 MB' : '720 KB',
        reportType: selectedReportType
      }
      setReports([newReport, ...reports])
      setIsGenerating(false)
      setGenerationFeedback(`Successfully generated ${newReport.title}. Ready for download.`)

      setTimeout(() => {
        setGenerationFeedback(null)
      }, 4000)
    }, 1000)
  }

  // Handle simulated report download
  const handleDownload = (report: ReportRecord) => {
    const dummyContent = `TapRide Admin Portal Report\nTitle: ${report.title}\nReport ID: ${report.id}\nDate: ${report.date}\nGenerated By: ${report.generatedBy}\nFormat: ${report.format}\nStatus: Verified\nCoverage: North Central Province (Route 81: Anuradhapura - Polonnaruwa)\n`
    const blob = new Blob([dummyContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${report.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.${report.format.toLowerCase()}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Handle operator status change
  const handleApprovalAction = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setApprovals((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    )
    if (selectedApproval && selectedApproval.id === id) {
      setSelectedApproval((prev) => (prev ? { ...prev, status: newStatus } : null))
    }
  }

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length

  // Filtered reports for search
  const filteredReports = reports.filter(
    (rep) =>
      rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.generatedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.format.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
            T
          </div>
          <div>
            <h1 className="font-bold text-slate-900 leading-tight text-base tracking-tight">TapRide</h1>
            <p className="text-xs text-slate-400 font-medium">Admin Portal</p>
          </div>
        </div>

        {/* Navigation Categories */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {/* OVERVIEW */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Overview
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveMenu('Dashboard')
                  setActiveTab('reports')
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Dashboard' && activeTab === 'reports'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('Live Operations')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Live Operations'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-slate-400" />
                  <span>Live Operations</span>
                </div>
                <span className="bg-rose-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  24
                </span>
              </button>
            </nav>
          </div>

          {/* MANAGEMENT */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Management
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveMenu('Passengers')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Passengers'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Users className="w-4 h-4 text-slate-400" />
                <span>Passengers</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMenu('Bus Owners')
                  setActiveTab('approvals')
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Bus Owners' && activeTab === 'approvals'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>Bus Owners</span>
                </div>
                {pendingApprovalsCount > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('Fleet Management')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Fleet Management'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Bus className="w-4 h-4 text-slate-400" />
                <span>Fleet Management</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMenu('Conductors')
                  setActiveTab('approvals')
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Conductors'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4 text-slate-400" />
                <span>Conductors</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('Routes & Fares')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Routes & Fares'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <ArrowLeftRight className="w-4 h-4 text-slate-400" />
                <span>Routes & Fares</span>
              </button>
            </nav>
          </div>

          {/* FINANCE */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Finance
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveMenu('Transactions')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Transactions'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Transactions</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('Settlements')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Settlements'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-4 h-4 text-slate-400" />
                  <span>Settlements</span>
                </div>
                <span className="bg-rose-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  7
                </span>
              </button>
            </nav>
          </div>

          {/* SYSTEM */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              System
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  setActiveMenu('Reports')
                  setActiveTab('reports')
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeMenu === 'Reports' && activeTab === 'reports'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('Settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Settings'
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* User Card at Bottom */}
        <div className="p-4 border-t border-slate-100 m-3 rounded-xl bg-slate-50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
            AD
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate">System Admin</p>
            <p className="text-xs text-slate-500 truncate">Administrator</p>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP NAVBAR */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div>
            <h2 className="text-lg font-bold text-slate-900">TapRide - User & Operator Management</h2>
            <p className="text-xs text-slate-500">Generate, view, and export operational and financial reports</p>
          </div>

          <div className="flex items-center gap-4">
            {/* View Switcher Tabs */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'reports'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Reports & Analytics
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('approvals')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  activeTab === 'approvals'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Pending Approvals</span>
                {pendingApprovalsCount > 0 && (
                  <span className="w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {pendingApprovalsCount}
                  </span>
                )}
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-60 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* FEEDBACK BANNER */}
        {generationFeedback && (
          <div className="mx-8 mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="font-medium">{generationFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setGenerationFeedback(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          {activeTab === 'reports' ? (
            <>
              {/* PAGE SUBHEADER */}
              <div>
                <h3 className="text-xl font-bold text-slate-900">TapRide - User & Operator Management</h3>
                <p className="text-sm text-slate-500">Generate and review TapRide operational and financial reports.</p>
              </div>

              {/* REPORT GENERATION FILTER BAR */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  {/* REPORT TYPE */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Report Type
                    </label>
                    <div className="relative">
                      <select
                        value={selectedReportType}
                        onChange={(e) => setSelectedReportType(e.target.value)}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 pr-8 font-medium cursor-pointer"
                      >
                        <option value="Revenue & Transactions">Revenue & Transactions</option>
                        <option value="Route 81 Fleet Performance">Route 81 Fleet Performance</option>
                        <option value="Conductor Audit & Verification">Conductor Audit & Verification</option>
                        <option value="Operator & Bus Owner Settlements">Operator & Bus Owner Settlements</option>
                        <option value="Passenger Boarding Metrics">Passenger Boarding Metrics</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* DATE RANGE */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Date Range
                    </label>
                    <input
                      type="text"
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>

                  {/* FORMAT */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Format
                    </label>
                    <div className="relative">
                      <select
                        value={selectedFormat}
                        onChange={(e) => setSelectedFormat(e.target.value as 'PDF' | 'XLSX' | 'CSV')}
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-blue-500 pr-8 font-medium cursor-pointer"
                      >
                        <option value="PDF">PDF</option>
                        <option value="XLSX">XLSX</option>
                        <option value="CSV">CSV</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div>
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={handleGenerateReport}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
                    >
                      {isGenerating ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <span>Generate Report</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 4 SUMMARY METRIC CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Revenue */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Rs. 38.7M
                  </p>
                </div>

                {/* Transactions */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Transactions
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    284,921
                  </p>
                </div>

                {/* Avg Fare */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Avg. Fare
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Rs. 184
                  </p>
                </div>

                {/* Success Rate */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Success Rate
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    99.2%
                  </p>
                </div>
              </div>

              {/* REVENUE TREND & RECENT REPORTS SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Line Chart Card (2 cols) */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-900 text-base">Revenue Trend</h4>
                    <span className="text-xs text-slate-400 font-medium">Last 30 days</span>
                  </div>

                  {/* SVG Chart with Y-axis and Gridlines */}
                  <div className="relative w-full h-64 mt-2">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-4 w-12 flex flex-col justify-between text-[11px] text-slate-400 font-medium">
                      <span>2.0M</span>
                      <span>1.5M</span>
                      <span>1.0M</span>
                      <span>500K</span>
                      <span>0</span>
                    </div>

                    {/* SVG Graphic */}
                    <div className="ml-14 h-full relative">
                      {/* Dotted horizontal gridlines */}
                      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4">
                        <div className="border-b border-dashed border-slate-200 w-full" />
                        <div className="border-b border-dashed border-slate-200 w-full" />
                        <div className="border-b border-dashed border-slate-200 w-full" />
                        <div className="border-b border-dashed border-slate-200 w-full" />
                        <div className="border-b border-slate-200 w-full" />
                      </div>

                      {/* Line Chart SVG */}
                      <svg
                        className="w-full h-full pb-4 overflow-visible"
                        viewBox="0 0 500 200"
                        preserveAspectRatio="none"
                      >
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        {/* Area Fill */}
                        <path
                          d="M 0 145 Q 60 135, 110 148 T 200 110 T 290 138 T 370 85 T 440 100 T 500 65 L 500 200 L 0 200 Z"
                          fill="url(#revenueGradient)"
                        />
                        {/* Smooth Line */}
                        <path
                          d="M 0 145 Q 60 135, 110 148 T 200 110 T 290 138 T 370 85 T 440 100 T 500 65"
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        {/* Data Points */}
                        <circle cx="0" cy="145" r="3" fill="#2563eb" />
                        <circle cx="110" cy="148" r="3" fill="#2563eb" />
                        <circle cx="200" cy="110" r="3" fill="#2563eb" />
                        <circle cx="290" cy="138" r="3" fill="#2563eb" />
                        <circle cx="370" cy="85" r="3" fill="#2563eb" />
                        <circle cx="440" cy="100" r="3" fill="#2563eb" />
                        <circle cx="500" cy="65" r="3" fill="#2563eb" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Recent Reports Card (1 col) */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-slate-900 text-base">Recent Reports</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const tableElem = document.getElementById('report-activity-table')
                        tableElem?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
                    >
                      View All &rarr;
                    </button>
                  </div>

                  {/* List of 4 report cards matching wireframe */}
                  <div className="space-y-3">
                    {reports.slice(0, 4).map((rep) => (
                      <div
                        key={rep.id}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl p-3.5 flex items-center justify-between transition-colors"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">{rep.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {rep.date} • {rep.format}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownload(rep)}
                          className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors shadow-2xs"
                          title={`Download ${rep.title}`}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* REPORT ACTIVITY DATA TABLE */}
              <div
                id="report-activity-table"
                className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="p-6 border-b border-slate-100">
                  <h4 className="font-bold text-slate-900 text-base">Report Activity</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75">
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Report
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Generated By
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Format
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {filteredReports.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6 font-semibold text-slate-900">
                            {rep.title}
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            {rep.generatedBy}
                          </td>
                          <td className="py-4 px-6 text-slate-500">
                            {rep.date}
                          </td>
                          <td className="py-4 px-6 font-medium text-slate-700">
                            {rep.format}
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {rep.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => handleDownload(rep)}
                              className="text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors cursor-pointer"
                            >
                              Download
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredReports.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No reports matched your search query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* OPERATOR & CONDUCTOR APPROVAL MANAGEMENT TAB */
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">User & Operator Approval Queue</h3>
                <p className="text-sm text-slate-500">
                  Review and verify bus owner permits, conductor licenses, and operator registrations for North Central Province (Route 81).
                </p>
              </div>

              {/* Approval Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Pending Verification
                  </p>
                  <p className="text-2xl font-extrabold text-amber-600">
                    {approvals.filter((a) => a.status === 'PENDING').length} Operators
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Approved Operators
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-600">
                    {approvals.filter((a) => a.status === 'APPROVED').length + 42} Active
                  </p>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Depot Jurisdiction
                  </p>
                  <p className="text-base font-bold text-slate-800">
                    Anuradhapura & Polonnaruwa
                  </p>
                </div>
              </div>

              {/* Approvals Table */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base">Pending Applications</h4>
                  <span className="text-xs text-slate-500">NCP Transport Authority Authority Verification</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/75">
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Reg / Vehicle No.
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Depot & Route
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-3 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {approvals.map((app) => (
                        <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-6">
                            <p className="font-semibold text-slate-900">{app.name}</p>
                            <p className="text-xs text-slate-400">NIC: {app.nic}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                              {app.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono font-medium text-slate-800">
                            {app.regNumber}
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            <p className="text-xs font-semibold">{app.depot}</p>
                            <p className="text-[11px] text-slate-400">{app.route}</p>
                          </td>
                          <td className="py-4 px-6">
                            {app.status === 'PENDING' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                PENDING
                              </span>
                            )}
                            {app.status === 'APPROVED' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                APPROVED
                              </span>
                            )}
                            {app.status === 'REJECTED' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                REJECTED
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            {app.status === 'PENDING' ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApprovalAction(app.id, 'APPROVED')}
                                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApprovalAction(app.id, 'REJECTED')}
                                  className="px-3 py-1 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-xs font-semibold rounded-md transition-colors"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedApproval(app)}
                                  className="px-2.5 py-1 text-blue-600 hover:underline text-xs font-semibold"
                                >
                                  Review
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedApproval(app)}
                                className="text-blue-600 hover:underline text-xs font-semibold"
                              >
                                View Record
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer className="h-12 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-xs text-slate-400">
          <span>&copy; 2026 TapRide Admin Portal</span>
          <span>All generated reports are logged for audit purposes.</span>
        </footer>
      </div>

      {/* NOTIFICATIONS FLYOUT */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-xs"
            onClick={() => setShowNotifications(false)}
          />
          <div className="relative w-80 bg-white shadow-2xl h-full flex flex-col z-10 border-l border-slate-200 p-6 animate-slide-left">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h4 className="font-bold text-slate-900">Admin Alerts</h4>
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 flex-1 overflow-y-auto">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                <p className="font-bold text-amber-900 mb-1">Pending Operator Approval</p>
                <p className="text-amber-700">
                  Sunil Wickramasinghe submitted bus permit registration for NC-6284 (Route 81).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false)
                    setActiveTab('approvals')
                  }}
                  className="mt-2 text-blue-600 font-bold hover:underline"
                >
                  Review in Approvals &rarr;
                </button>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                <p className="font-bold text-blue-900 mb-1">Weekly Report Generated</p>
                <p className="text-blue-700">
                  Weekly Settlement Summary for Aug 23 - Aug 29 is ready for download.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* APPLICATION REVIEW MODAL */}
      {selectedApproval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => setSelectedApproval(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 z-10 space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-lg">Application Details</h4>
                <p className="text-xs text-slate-500">
                  Application ID: {selectedApproval.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedApproval(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Applicant Name</span>
                <span className="font-bold text-slate-900">{selectedApproval.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Role Category</span>
                <span className="font-semibold text-slate-800">{selectedApproval.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Vehicle / Reg ID</span>
                <span className="font-mono font-bold text-blue-600">{selectedApproval.regNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Assigned Depot</span>
                <span className="font-medium text-slate-800">{selectedApproval.depot}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Route Corridor</span>
                <span className="font-medium text-slate-800">{selectedApproval.route}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">National ID (NIC)</span>
                <span className="font-mono text-slate-700">{selectedApproval.nic}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400 font-medium">Contact Phone</span>
                <span className="text-slate-700">{selectedApproval.contact}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-medium">Status</span>
                <span className="font-bold text-slate-900">{selectedApproval.status}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              {selectedApproval.status === 'PENDING' ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleApprovalAction(selectedApproval.id, 'REJECTED')}
                    className="px-4 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovalAction(selectedApproval.id, 'APPROVED')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                  >
                    Approve Operator
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReportsManagement