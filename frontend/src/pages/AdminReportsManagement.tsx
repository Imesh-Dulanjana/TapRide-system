import React, { useState, useEffect } from 'react'
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
  Clock,
  X,
  MapPin,
  ShieldAlert,
  AlertTriangle
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

interface OperatorRecord {
  id: string
  name: string
  role: 'Bus Owner' | 'Conductor' | 'Fleet Operator'
  regNumber: string
  depot: string
  route: string
  submissionDate: string
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED'
  nic: string
  contact: string
}

interface PassengerRecord {
  id: string
  name: string
  nic: string
  phone: string
  balance: number
  tripsTaken: number
  status: 'ACTIVE' | 'SUSPENDED' | 'FLAGGED'
}

interface LiveBus {
  plate: string
  driver: string
  conductor: string
  currentHalt: string
  speed: string
  passengers: number
  status: 'ON ROUTE' | 'AT TERMINAL' | 'SUSPENDED'
}

interface TransactionRecord {
  id: string
  passenger: string
  vehicle: string
  segment: string
  fare: number
  time: string
  status: 'SETTLED' | 'REFUNDED' | 'DISPUTED'
}

export const AdminReportsManagement: React.FC = () => {
  // Navigation
  const [activeMenu, setActiveMenu] = useState<string>('Reports')

  // Search
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Report generation state
  const [selectedReportType, setSelectedReportType] = useState<string>('Revenue & Transactions')
  const [dateRange, setDateRange] = useState<string>('Aug 1, 2026 – Aug 29, 2026')
  const [selectedFormat, setSelectedFormat] = useState<'PDF' | 'XLSX' | 'CSV'>('PDF')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null)

  // Top notifications modal
  const [showNotifications, setShowNotifications] = useState<boolean>(false)

  // Confirmation dialog modal state for admin critical actions
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    actionLabel: string
    isDestructive?: boolean
    onConfirm: () => void
  } | null>(null)

  // Live dynamic telemetry and metrics state
  const [totalRevenue, setTotalRevenue] = useState<number>(38740200)
  const [totalTransactions, setTotalTransactions] = useState<number>(284921)
  const activeFleetCount = 24

  // Live simulated stream toggle
  const [liveStreamEnabled, setLiveStreamEnabled] = useState<boolean>(true)

  // Operator and User state (fully editable & suspendable by TapRide Admin)
  const [operators, setOperators] = useState<OperatorRecord[]>([
    {
      id: 'OP-8101',
      name: 'Sunil Wickramasinghe',
      role: 'Bus Owner',
      regNumber: 'NC-6284',
      depot: 'Anuradhapura Central Depot',
      route: 'Route 81 (Anuradhapura - Polonnaruwa)',
      submissionDate: 'Aug 28, 2026',
      status: 'ACTIVE',
      nic: '197812903841',
      contact: '+94 77 123 4567'
    },
    {
      id: 'OP-8102',
      name: 'Mahesh Bandara',
      role: 'Conductor',
      regNumber: 'COND-NCP-402',
      depot: 'Polonnaruwa Kaduruwela Depot',
      route: 'Route 81 (Kaduruwela - Anuradhapura)',
      submissionDate: 'Aug 27, 2026',
      status: 'ACTIVE',
      nic: '199234819022',
      contact: '+94 71 987 6543'
    },
    {
      id: 'OP-8103',
      name: 'Rajarata Express Logistics',
      role: 'Fleet Operator',
      regNumber: 'FLT-81-009',
      depot: 'Habarana Junction Terminal',
      route: 'Route 81 Corridor',
      submissionDate: 'Aug 26, 2026',
      status: 'PENDING',
      nic: 'PV00293819',
      contact: '+94 25 222 3456'
    },
    {
      id: 'OP-8104',
      name: 'Dharmadasa Perera',
      role: 'Conductor',
      regNumber: 'COND-NCP-119',
      depot: 'Kekirawa Town Station',
      route: 'Route 81 Corridor',
      submissionDate: 'Aug 24, 2026',
      status: 'SUSPENDED',
      nic: '198291029384',
      contact: '+94 72 334 9912'
    }
  ])

  // Passengers list data (TapRide Admin can suspend or flag accounts)
  const [passengers, setPassengers] = useState<PassengerRecord[]>([
    { id: 'TR-2048', name: 'Imesh Dulanjana', nic: '199920194820', phone: '+94 77 912 3456', balance: 850, tripsTaken: 48, status: 'ACTIVE' },
    { id: 'TR-1874', name: 'Nalaka Senanayake', nic: '198539201928', phone: '+94 71 445 9921', balance: 320, tripsTaken: 22, status: 'ACTIVE' },
    { id: 'TR-3091', name: 'Kumari Jayasinghe', nic: '199274819201', phone: '+94 76 881 2049', balance: 140, tripsTaken: 15, status: 'ACTIVE' },
    { id: 'TR-4102', name: 'Dhammika Silva', nic: '197410293847', phone: '+94 70 334 1182', balance: 0, tripsTaken: 3, status: 'FLAGGED' },
    { id: 'TR-5519', name: 'Rohan Wickrama', nic: '198810293819', phone: '+94 78 221 0049', balance: -45, tripsTaken: 12, status: 'SUSPENDED' }
  ])

  // Live fleet buses (Admin can suspend vehicle or change dispatch)
  const [liveBuses, setLiveBuses] = useState<LiveBus[]>([
    { plate: 'NC-4521', driver: 'K. Somapala', conductor: 'A. Perera', currentHalt: 'Habarana Junction', speed: '52 km/h', passengers: 42, status: 'ON ROUTE' },
    { plate: 'NC-6284', driver: 'P. Jayatissa', conductor: 'M. Bandara', currentHalt: 'Minneriya', speed: '48 km/h', passengers: 38, status: 'ON ROUTE' },
    { plate: 'NC-9912', driver: 'R. Dharmasena', conductor: 'S. Alwis', currentHalt: 'Anuradhapura Terminal', speed: '0 km/h', passengers: 0, status: 'AT TERMINAL' },
    { plate: 'NC-1830', driver: 'W. Karunaratne', conductor: 'T. Dulanjana', currentHalt: 'Kaduruwela Station', speed: '0 km/h', passengers: 14, status: 'ON ROUTE' }
  ])

  // Transactions list
  const [transactions, setTransactions] = useState<TransactionRecord[]>([
    { id: 'TX-910283', passenger: 'Passenger TR-2048', vehicle: 'NC-4521', segment: 'Anuradhapura → Kaduruwela', fare: 220, time: '11:14 PM', status: 'SETTLED' },
    { id: 'TX-910282', passenger: 'Passenger TR-1874', vehicle: 'NC-6284', segment: 'Minneriya → Polonnaruwa Old Town', fare: 60, time: '11:10 PM', status: 'SETTLED' },
    { id: 'TX-910281', passenger: 'Passenger TR-3091', vehicle: 'NC-4521', segment: 'Kekirawa → Habarana Junction', fare: 45, time: '11:02 PM', status: 'SETTLED' },
    { id: 'TX-910280', passenger: 'Passenger TR-5519', vehicle: 'NC-1830', segment: 'Mihintale → Maradankadawala', fare: 30, time: '10:55 PM', status: 'DISPUTED' }
  ])

  // Reports list
  const [reports, setReports] = useState<ReportRecord[]>([
    { id: 'REP-001', title: 'Daily Revenue Report', generatedBy: 'System Admin', date: 'Aug 29, 2026', format: 'PDF', status: 'READY', fileSize: '1.4 MB', reportType: 'Revenue & Transactions' },
    { id: 'REP-002', title: 'Settlement Summary', generatedBy: 'System Admin', date: 'Aug 28, 2026', format: 'PDF', status: 'READY', fileSize: '890 KB', reportType: 'Settlement & Payouts' },
    { id: 'REP-003', title: 'Fleet Performance Report', generatedBy: 'System Admin', date: 'Aug 28, 2026', format: 'XLSX', status: 'READY', fileSize: '2.1 MB', reportType: 'Fleet Operations' },
    { id: 'REP-004', title: 'Transaction Audit', generatedBy: 'System Admin', date: 'Aug 27, 2026', format: 'PDF', status: 'READY', fileSize: '3.6 MB', reportType: 'Revenue & Transactions' },
    { id: 'REP-005', title: 'Route 81 Conductor Log', generatedBy: 'System Admin', date: 'Aug 26, 2026', format: 'CSV', status: 'READY', fileSize: '540 KB', reportType: 'Operations' }
  ])

  // Route 81 stages data
  const [routeStages, setRouteStages] = useState([
    { stage: 1, name: 'Anuradhapura (New Town)', distance: '0.0 km', baseFare: 30 },
    { stage: 2, name: 'Mihintale Junction', distance: '12.4 km', baseFare: 45 },
    { stage: 3, name: 'Maradankadawala', distance: '28.1 km', baseFare: 60 },
    { stage: 4, name: 'Kekirawa Town', distance: '41.6 km', baseFare: 80 },
    { stage: 5, name: 'Habarana Junction', distance: '63.2 km', baseFare: 105 },
    { stage: 6, name: 'Minneriya', distance: '78.5 km', baseFare: 130 },
    { stage: 7, name: 'Hingurakgoda', distance: '89.0 km', baseFare: 160 },
    { stage: 8, name: 'Giritale', distance: '98.4 km', baseFare: 190 },
    { stage: 9, name: 'Polonnaruwa Old Town', distance: '109.1 km', baseFare: 220 },
    { stage: 10, name: 'Kaduruwela (Polonnaruwa Central)', distance: '114.8 km', baseFare: 220 }
  ])

  // System Configuration (Admin controlled)
  const [provincialRate, setProvincialRate] = useState<string>('22.00')
  const [platformFee, setPlatformFee] = useState<string>('3.0')
  const [emergencyLockdown, setEmergencyLockdown] = useState<boolean>(false)

  // Real-time live data incoming pulse (Simulating live bus trips across Route 81)
  useEffect(() => {
    if (!liveStreamEnabled) return

    const interval = setInterval(() => {
      // Simulate live fare incoming
      const randomFare = [30, 45, 60, 80, 105, 130, 160, 190, 220][Math.floor(Math.random() * 9)]
      setTotalRevenue((prev) => prev + randomFare)
      setTotalTransactions((prev) => prev + 1)

      // Random speed fluctuations on active buses
      setLiveBuses((prev) =>
        prev.map((bus) => {
          if (bus.status === 'ON ROUTE') {
            const nextSpeed = Math.floor(40 + Math.random() * 20)
            return { ...bus, speed: `${nextSpeed} km/h` }
          }
          return bus
        })
      )
    }, 4500)

    return () => clearInterval(interval)
  }, [liveStreamEnabled])

  // Admin Actions: Suspend or Activate Passenger with Confirmation
  const promptTogglePassengerStatus = (passenger: PassengerRecord) => {
    const isSuspending = passenger.status === 'ACTIVE'
    setConfirmDialog({
      isOpen: true,
      title: isSuspending ? 'Suspend Passenger Account' : 'Reactivate Passenger Account',
      message: isSuspending
        ? `Are you sure you want to suspend passenger ${passenger.name} (${passenger.id})? This will immediately lock digital QR boarding access along Route 81.`
        : `Reactivate transit privileges for passenger ${passenger.name} (${passenger.id})?`,
      actionLabel: isSuspending ? 'Suspend Passenger' : 'Reactivate Passenger',
      isDestructive: isSuspending,
      onConfirm: () => {
        setPassengers((prev) =>
          prev.map((p) => {
            if (p.id === passenger.id) {
              const nextStatus = p.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
              setAdminFeedback(`Admin action: Passenger ${p.id} (${p.name}) status changed to ${nextStatus}.`)
              setTimeout(() => setAdminFeedback(null), 3500)
              return { ...p, status: nextStatus }
            }
            return p
          })
        )
        setConfirmDialog(null)
      }
    })
  }

  // Admin Actions: Suspend or Activate Bus Owner / Conductor with Confirmation
  const promptToggleOperatorStatus = (operator: OperatorRecord) => {
    const isSuspending = operator.status === 'ACTIVE'
    setConfirmDialog({
      isOpen: true,
      title: isSuspending ? `Suspend ${operator.role}` : `Reinstate ${operator.role}`,
      message: isSuspending
        ? `Are you sure you want to suspend ${operator.role} ${operator.name} (${operator.regNumber})? This will halt dispatch rights and freeze automated settlement disbursements.`
        : `Reinstate operating permits and corridor rights for ${operator.role} ${operator.name} (${operator.regNumber})?`,
      actionLabel: isSuspending ? 'Confirm Suspension' : 'Confirm Reinstatement',
      isDestructive: isSuspending,
      onConfirm: () => {
        setOperators((prev) =>
          prev.map((op) => {
            if (op.id === operator.id) {
              const nextStatus = op.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
              setAdminFeedback(`Admin action: ${op.role} ${op.name} (${op.regNumber}) set to ${nextStatus}.`)
              setTimeout(() => setAdminFeedback(null), 3500)
              return { ...op, status: nextStatus }
            }
            return op
          })
        )
        setConfirmDialog(null)
      }
    })
  }

  // Admin Actions: Suspend Vehicle with Confirmation
  const promptToggleBusStatus = (bus: LiveBus) => {
    const isSuspending = bus.status !== 'SUSPENDED'
    setConfirmDialog({
      isOpen: true,
      title: isSuspending ? 'Ground / Suspend Vehicle' : 'Return Vehicle to Service',
      message: isSuspending
        ? `Are you sure you want to suspend bus plate ${bus.plate} currently at ${bus.currentHalt}? Conductor terminal scanning on this bus will be immediately frozen.`
        : `Authorize vehicle ${bus.plate} to resume revenue operations along Route 81?`,
      actionLabel: isSuspending ? 'Suspend Bus' : 'Authorize Bus',
      isDestructive: isSuspending,
      onConfirm: () => {
        setLiveBuses((prev) =>
          prev.map((b) => {
            if (b.plate === bus.plate) {
              const nextStatus = b.status === 'SUSPENDED' ? 'ON ROUTE' : 'SUSPENDED'
              setAdminFeedback(`Admin action: Vehicle ${b.plate} status changed to ${nextStatus}.`)
              setTimeout(() => setAdminFeedback(null), 3500)
              return { ...b, status: nextStatus, speed: nextStatus === 'SUSPENDED' ? '0 km/h' : '45 km/h' }
            }
            return b
          })
        )
        setConfirmDialog(null)
      }
    })
  }

  // Admin Actions: Refund or Dispute Transaction with Confirmation
  const promptTransactionAction = (txId: string, action: 'REFUNDED' | 'SETTLED', fare: number) => {
    setConfirmDialog({
      isOpen: true,
      title: action === 'REFUNDED' ? 'Authorize Passenger Fare Refund' : 'Dismiss Dispute',
      message: action === 'REFUNDED'
        ? `Confirm refund of Rs. ${fare.toFixed(2)} for transaction ${txId}? This will reverse the fare from operator settlement totals.`
        : `Dismiss disputed charge on transaction ${txId} and mark as settled?`,
      actionLabel: action === 'REFUNDED' ? 'Process Refund' : 'Dismiss Dispute',
      isDestructive: action === 'REFUNDED',
      onConfirm: () => {
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === txId ? { ...tx, status: action } : tx))
        )
        setAdminFeedback(`Admin action: Transaction ${txId} marked as ${action}.`)
        setTimeout(() => setAdminFeedback(null), 3500)
        setConfirmDialog(null)
      }
    })
  }

  // Admin Actions: Edit Route Stage Fare with Confirmation
  const promptEditStageFare = (stageObj: { stage: number; name: string; baseFare: number }) => {
    const enteredFare = prompt(`Enter new gazetted fare for Stage ${stageObj.stage} - ${stageObj.name} (Rs.):`, String(stageObj.baseFare))
    if (!enteredFare || isNaN(Number(enteredFare)) || Number(enteredFare) <= 0) return

    const newFare = Number(enteredFare)
    setConfirmDialog({
      isOpen: true,
      title: `Update Tariff for Stage ${stageObj.stage}`,
      message: `Are you sure you want to update Stage ${stageObj.stage} (${stageObj.name}) from Rs. ${stageObj.baseFare} to Rs. ${newFare}? This will affect all live QR ticket calculations along Route 81 immediately.`,
      actionLabel: 'Confirm Fare Change',
      isDestructive: false,
      onConfirm: () => {
        setRouteStages((prev) =>
          prev.map((s) => (s.stage === stageObj.stage ? { ...s, baseFare: newFare } : s))
        )
        setAdminFeedback(`Admin action: Stage ${stageObj.stage} (${stageObj.name}) fare updated to Rs. ${newFare}.`)
        setTimeout(() => setAdminFeedback(null), 3500)
        setConfirmDialog(null)
      }
    })
  }

  // Report generation handler
  const handleGenerateReport = () => {
    setIsGenerating(true)
    setAdminFeedback(null)

    setTimeout(() => {
      const newReport: ReportRecord = {
        id: `REP-${String(reports.length + 1).padStart(3, '0')}`,
        title: `${selectedReportType} (${selectedFormat})`,
        generatedBy: 'TapRide Super Admin',
        date: 'Aug 29, 2026',
        format: selectedFormat,
        status: 'READY',
        fileSize: selectedFormat === 'PDF' ? '1.8 MB' : selectedFormat === 'XLSX' ? '2.4 MB' : '720 KB',
        reportType: selectedReportType
      }
      setReports([newReport, ...reports])
      setIsGenerating(false)
      setAdminFeedback(`Successfully generated ${newReport.title}. Ready for download.`)
      setTimeout(() => setAdminFeedback(null), 4000)
    }, 900)
  }

  // Download simulation
  const handleDownload = (report: ReportRecord) => {
    const dummyContent = `TapRide Central Authority Audit Log\nReport: ${report.title}\nReport ID: ${report.id}\nIssued by: TapRide Super Admin\nScope: Route 81 (Anuradhapura - Polonnaruwa)\nStatus: Verified\n`
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

  const pendingApprovalsCount = operators.filter((o) => o.status === 'PENDING').length

  // Filtered reports for search
  const filteredReports = reports.filter(
    (rep) =>
      rep.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.generatedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rep.format.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* LEFT SIDEBAR - TAPRIDE CENTRAL ADMIN CONTROL */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 min-h-screen">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="TapRide Logo"
              className="w-10 h-10 rounded-xl object-contain shadow-sm border border-slate-100"
            />
            <div>
              <h1 className="font-bold text-slate-900 leading-tight text-base tracking-tight">TapRide</h1>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider text-[10px]">Super Admin Portal</p>
            </div>
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
                onClick={() => setActiveMenu('Dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Dashboard'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
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
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Radio className="w-4 h-4 text-slate-400" />
                  <span>Live Operations</span>
                </div>
                <span className="bg-rose-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  {activeFleetCount}
                </span>
              </button>
            </nav>
          </div>

          {/* MANAGEMENT */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Authority Controls
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveMenu('Passengers')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Passengers'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Passengers</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                  {passengers.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('Bus Owners')}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Bus Owners'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <span>Bus Owners</span>
                </div>
                {pendingApprovalsCount > 0 && (
                  <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {pendingApprovalsCount} new
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('Fleet Management')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Fleet Management'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Bus className="w-4 h-4 text-slate-400" />
                <span>Fleet Management</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('Conductors')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Conductors'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
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
                    ? 'bg-blue-50 text-blue-600 font-semibold'
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
              Financial Audit
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveMenu('Transactions')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeMenu === 'Transactions'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
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
                    ? 'bg-blue-50 text-blue-600 font-semibold'
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
              System Administration
            </p>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveMenu('Reports')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  activeMenu === 'Reports'
                    ? 'bg-blue-50 text-blue-600 font-semibold'
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
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Settings</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Super Admin Status Card */}
        <div className="p-4 border-t border-slate-100 m-3 rounded-xl bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-sm shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">TapRide Admin</p>
              <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Full System Power
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* TOP NAVBAR - 100% Matching Wireframe Figure C.18 */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="min-w-0 pr-4">
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {activeMenu === 'Reports' || activeMenu === 'Dashboard'
                ? 'TapRide - User & Operator Management'
                : `TapRide - ${activeMenu}`}
            </h2>
            <p className="text-xs text-slate-400 font-normal">
              {activeMenu === 'Reports' || activeMenu === 'Dashboard'
                ? 'Generate, view, and export operational and financial reports'
                : `TapRide Central Authority Control Center • Route 81 Corridor`}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            {/* Live Data Incoming Indicator */}
            <button
              type="button"
              onClick={() => setLiveStreamEnabled(!liveStreamEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                liveStreamEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
              title="Click to toggle live telemetry updates"
            >
              <span className={`w-2 h-2 rounded-full ${liveStreamEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              <span>{liveStreamEnabled ? 'Live Stream Active' : 'Live Stream Paused'}</span>
            </button>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search anything..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-52 text-xs bg-slate-50/80 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-200"
              title="System Alerts & Incident Queue"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* ADMIN ACTION FEEDBACK BANNER */}
        {adminFeedback && (
          <div className="mx-8 mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-blue-900 text-sm shadow-xs animate-fade-in">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="font-semibold text-xs">{adminFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setAdminFeedback(null)}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SCROLLABLE BODY BASED ON ACTIVE MENU */}
        <main className="p-8 space-y-6 flex-1 overflow-y-auto">
          {/* 1. REPORTS & DASHBOARD VIEW (FIGURE C.18 WIREFRAME) */}
          {(activeMenu === 'Reports' || activeMenu === 'Dashboard') && (
            <>
              {/* PAGE SUBHEADER */}
              <div>
                <h3 className="text-xl font-bold text-slate-900">TapRide - User & Operator Management</h3>
                <p className="text-sm text-slate-500">Generate and review TapRide operational and financial reports.</p>
              </div>

              {/* REPORT GENERATION FILTER BAR */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  {/* REPORT TYPE */}
                  <div className="md:col-span-4">
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
                  <div className="md:col-span-3">
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
                  <div className="md:col-span-2">
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
                  <div className="md:col-span-3">
                    <button
                      type="button"
                      disabled={isGenerating}
                      onClick={handleGenerateReport}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm shadow-sm transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
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

              {/* 4 SUMMARY METRIC CARDS - LIVE REAL-TIME DATA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Total Revenue */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Total Revenue
                    </p>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Live stream active" />
                  </div>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    Rs. {(totalRevenue / 1000000).toFixed(2)}M
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Live settled Route 81 fare sum</p>
                </div>

                {/* Transactions */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Transactions
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {totalTransactions.toLocaleString()}
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">+1 every few seconds</p>
                </div>

                {/* Avg Fare */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Avg. Fare
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    Rs. {(totalRevenue / totalTransactions).toFixed(0)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium mt-1">NCP provincial weighted avg</p>
                </div>

                {/* Success Rate */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Success Rate
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    99.2%
                  </p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">Instant offline/sync parity</p>
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
                        style={{ width: '100%', height: '100%' }}
                      >
                        <defs>
                          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
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
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* Data Points */}
                        <circle cx="0" cy="145" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="110" cy="148" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="200" cy="110" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="290" cy="138" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="370" cy="85" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="440" cy="100" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                        <circle cx="500" cy="65" r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
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
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-base">Report Activity</h4>
                  <span className="text-xs text-slate-400">Official TapRide Authority Audit Trail</span>
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
          )}

          {/* 2. LIVE OPERATIONS VIEW - ADMIN POWER TO RE-ROUTE OR SUSPEND VEHICLE */}
          {activeMenu === 'Live Operations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">TapRide Central Fleet Control</h3>
                  <p className="text-sm text-slate-500">
                    Live operational surveillance across Route 81 (Anuradhapura ↔ Polonnaruwa).
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    GPS Live Telemetry
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-400 font-bold uppercase">Active Buses</p>
                  <p className="text-2xl font-black text-slate-900 mt-1 font-mono">{liveBuses.filter((b) => b.status === 'ON ROUTE').length} On Route</p>
                </div>
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-400 font-bold uppercase">Live Passengers</p>
                  <p className="text-2xl font-black text-blue-600 mt-1 font-mono">
                    {liveBuses.reduce((acc, b) => acc + b.passengers, 0)} riders
                  </p>
                </div>
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-400 font-bold uppercase">Emergency Status</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">NORMAL</p>
                </div>
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-400 font-bold uppercase">Admin Command</p>
                  <button
                    type="button"
                    onClick={() => {
                      const nextState = !emergencyLockdown
                      setEmergencyLockdown(nextState)
                      setAdminFeedback(`Admin command: Fleet emergency lockdown ${nextState ? 'ACTIVATED' : 'DEACTIVATED'}.`)
                      setTimeout(() => setAdminFeedback(null), 4000)
                    }}
                    className={`mt-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                      emergencyLockdown ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {emergencyLockdown ? 'Lockdown Active' : 'Trigger Corridor Hold'}
                  </button>
                </div>
              </div>

              {/* Active Bus Telemetry Table with Admin Suspend Power */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Live Vehicle Fleet Telemetry</h4>
                  <span className="text-xs text-slate-400">Admin can suspend any bus instantly</span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="py-3 px-6">Vehicle Plate</th>
                      <th className="py-3 px-6">Assigned Crew</th>
                      <th className="py-3 px-6">Live Location</th>
                      <th className="py-3 px-6">Speed</th>
                      <th className="py-3 px-6">Load</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Admin Power</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {liveBuses.map((bus) => (
                      <tr key={bus.plate} className="hover:bg-slate-50/60">
                        <td className="py-4 px-6 font-mono font-bold text-slate-900">{bus.plate}</td>
                        <td className="py-4 px-6 text-slate-700">{bus.driver} • {bus.conductor}</td>
                        <td className="py-4 px-6 text-blue-600 font-medium flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5" />
                          {bus.currentHalt}
                        </td>
                        <td className="py-4 px-6 font-mono">{bus.speed}</td>
                        <td className="py-4 px-6">{bus.passengers} pax</td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            bus.status === 'ON ROUTE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bus.status === 'SUSPENDED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {bus.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => promptToggleBusStatus(bus)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                              bus.status === 'SUSPENDED'
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {bus.status === 'SUSPENDED' ? 'Reinstate Bus' : 'Suspend Vehicle'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. PASSENGERS VIEW - ADMIN POWER TO SUSPEND OR ACTIVATE RIDERS */}
          {activeMenu === 'Passengers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Passenger Account Administration</h3>
                  <p className="text-sm text-slate-500">TapRide central authority controls over passenger ridership permits, security status, and account suspension.</p>
                </div>
                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                  {passengers.filter((p) => p.status === 'ACTIVE').length} Active Riders
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Registered Riders (Route 81 Corridor)</h4>
                  <span className="text-xs text-slate-400">Admin can suspend passenger accounts or view trip history (Wallets are strictly managed by banking gateway/passenger top-ups)</span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="py-3 px-6">Passenger ID</th>
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6">NIC / Phone</th>
                      <th className="py-3 px-6">Wallet Balance</th>
                      <th className="py-3 px-6">Trips</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Admin Powers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {passengers.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="py-4 px-6 font-mono font-bold text-blue-600">{p.id}</td>
                        <td className="py-4 px-6 font-semibold text-slate-900">{p.name}</td>
                        <td className="py-4 px-6 text-slate-500 text-xs">
                          <div>NIC: {p.nic}</div>
                          <div>{p.phone}</div>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-900 font-mono">
                          Rs. {p.balance.toFixed(2)}
                        </td>
                        <td className="py-4 px-6">{p.tripsTaken} rides</td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => promptTogglePassengerStatus(p)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                              p.status === 'ACTIVE'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            {p.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. BUS OWNERS & CONDUCTORS (CENTRAL ADMIN APPROVAL & SUSPENSION) */}
          {(activeMenu === 'Bus Owners' || activeMenu === 'Conductors' || activeMenu === 'Fleet Management') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {activeMenu === 'Bus Owners' ? 'Bus Owner License & Operator Authority' : activeMenu === 'Conductors' ? 'Conductor Credential Management' : 'Fleet Registration & Operational Controls'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    Central authority power to grant permits, inspect vehicle compliance, or suspend non-compliant operators.
                  </p>
                </div>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-bold">
                  {operators.filter((o) => o.status === 'SUSPENDED').length} Suspended Operators
                </span>
              </div>

              {/* Table of Operator Approvals & Suspensions */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900">Registered Transport Operators</h4>
                  <span className="text-xs text-slate-500">TapRide NCP Authority Jurisdiction</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-400 uppercase">
                        <th className="py-3 px-6">Operator Name</th>
                        <th className="py-3 px-6">Role</th>
                        <th className="py-3 px-6">Reg / Vehicle No.</th>
                        <th className="py-3 px-6">Assigned Corridor</th>
                        <th className="py-3 px-6">Authority Status</th>
                        <th className="py-3 px-6 text-right">Admin Powers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {operators
                        .filter((op) => activeMenu === 'Fleet Management' || (activeMenu === 'Bus Owners' ? op.role !== 'Conductor' : op.role === 'Conductor'))
                        .map((op) => (
                        <tr key={op.id} className="hover:bg-slate-50/60">
                          <td className="py-4 px-6">
                            <p className="font-semibold text-slate-900">{op.name}</p>
                            <p className="text-xs text-slate-400">NIC: {op.nic}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-block bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                              {op.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono font-medium text-slate-800">
                            {op.regNumber}
                          </td>
                          <td className="py-4 px-6 text-slate-600">
                            <p className="text-xs font-semibold">{op.depot}</p>
                            <p className="text-[11px] text-slate-400">{op.route}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              op.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : op.status === 'SUSPENDED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {op.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              onClick={() => promptToggleOperatorStatus(op)}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-xs ${
                                op.status === 'SUSPENDED'
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {op.status === 'SUSPENDED' ? 'Reinstate Operator' : 'Suspend Operator'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. ROUTES & FARES VIEW - ADMIN CAN EDIT STAGE FARES */}
          {activeMenu === 'Routes & Fares' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Route 81 Corridor Tariff Schedule</h3>
                  <p className="text-sm text-slate-500">North Central Province gazetted stages. Admin can adjust stage base fares live.</p>
                </div>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-200">
                  Editable Tariff Table
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="py-3 px-6">Stage</th>
                      <th className="py-3 px-6">Halt Name</th>
                      <th className="py-3 px-6">Distance from Origin</th>
                      <th className="py-3 px-6">Stage Fare (Rs.)</th>
                      <th className="py-3 px-6 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {routeStages.map((st) => (
                      <tr key={st.stage} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-6 font-mono font-bold text-blue-600">Stage {st.stage}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-900">{st.name}</td>
                        <td className="py-3.5 px-6 font-mono text-slate-500">{st.distance}</td>
                        <td className="py-3.5 px-6 font-black text-emerald-600">Rs. {st.baseFare}</td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            type="button"
                            onClick={() => promptEditStageFare(st)}
                            className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 rounded transition-colors"
                          >
                            Edit Fare
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 6. TRANSACTIONS VIEW - ADMIN AUDIT, DISPUTES & REFUND POWER */}
          {activeMenu === 'Transactions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Financial Ledger & Disputed Charges</h3>
                  <p className="text-sm text-slate-500">Full audit oversight. TapRide Admin can issue refunds or resolve fare disputes.</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Real-time Settlement Parity
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase">
                    <tr>
                      <th className="py-3 px-6">Transaction ID</th>
                      <th className="py-3 px-6">Passenger</th>
                      <th className="py-3 px-6">Vehicle</th>
                      <th className="py-3 px-6">Segment</th>
                      <th className="py-3 px-6">Fare Paid</th>
                      <th className="py-3 px-6">Status</th>
                      <th className="py-3 px-6 text-right">Admin Powers</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/60">
                        <td className="py-3.5 px-6 font-mono font-bold text-blue-600">{tx.id}</td>
                        <td className="py-3.5 px-6 font-semibold text-slate-900">{tx.passenger}</td>
                        <td className="py-3.5 px-6 font-mono">{tx.vehicle}</td>
                        <td className="py-3.5 px-6 text-slate-600">{tx.segment}</td>
                        <td className="py-3.5 px-6 font-bold text-slate-900">Rs. {tx.fare.toFixed(2)}</td>
                        <td className="py-3.5 px-6">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            tx.status === 'SETTLED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : tx.status === 'REFUNDED'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right space-x-2">
                          {tx.status !== 'REFUNDED' && (
                            <button
                              type="button"
                              onClick={() => promptTransactionAction(tx.id, 'REFUNDED', tx.fare)}
                              className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors"
                            >
                              Issue Refund
                            </button>
                          )}
                          {tx.status === 'DISPUTED' && (
                            <button
                              type="button"
                              onClick={() => promptTransactionAction(tx.id, 'SETTLED', tx.fare)}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded transition-colors"
                            >
                              Dismiss Dispute
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 7. SETTLEMENTS VIEW */}
          {activeMenu === 'Settlements' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Operator Disbursements & Fee Management</h3>
                <p className="text-sm text-slate-500">Weekly net revenue disbursement audit for North Central Province bus owners.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-400 font-bold uppercase">Pending Operator Payouts</p>
                  <p className="text-3xl font-black text-slate-900 mt-1 font-mono">Rs. 298,740</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">Ready for Bank of Ceylon batch disbursement</p>
                </div>
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-400 font-bold uppercase">TapRide {platformFee}% Platform Take</p>
                  <p className="text-3xl font-black text-blue-600 mt-1 font-mono">Rs. 9,370</p>
                  <p className="text-xs text-slate-400 mt-1">Central commission revenue</p>
                </div>
                <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
                  <p className="text-xs text-slate-400 font-bold uppercase">Settled Cycles (Month)</p>
                  <p className="text-3xl font-black text-slate-800 mt-1 font-mono">4 Cycles</p>
                  <p className="text-xs text-slate-500 mt-1">Total Rs. 1.18M paid to fleet operators</p>
                </div>
              </div>
            </div>
          )}

          {/* 8. SETTINGS VIEW - TAPRIDE CENTRAL PARAMS */}
          {activeMenu === 'Settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-900">TapRide Central Platform Governance</h3>
                <p className="text-sm text-slate-500">Adjust tariff parameters and central platform fees for Route 81.</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Provincial Fare Kilometer Tariff (Rs. / km)
                  </label>
                  <input
                    type="number"
                    value={provincialRate}
                    onChange={(e) => setProvincialRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold"
                  />
                  <p className="text-xs text-slate-400 mt-1">NCP Gazetted base rate per passenger km</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    TapRide Platform Service Commission (%)
                  </label>
                  <input
                    type="number"
                    value={platformFee}
                    onChange={(e) => setPlatformFee(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold"
                  />
                  <p className="text-xs text-slate-400 mt-1">Operator settlement deduction percentage</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Jurisdiction Corridor
                  </label>
                  <input
                    type="text"
                    disabled
                    value="North Central Province (Anuradhapura ↔ Polonnaruwa)"
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-600"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAdminFeedback('Platform configuration saved. Live rates updated across all Route 81 terminals.')
                    setTimeout(() => setAdminFeedback(null), 3500)
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            </div>
          )}
        </main>

        {/* FOOTER */}
        <footer className="h-12 bg-white border-t border-slate-200 px-8 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>&copy; 2026 TapRide Central Administrative Portal</span>
          <span>All administrative overrides and suspensions are logged for audit purposes.</span>
        </footer>
      </div>

      {/* CONFIRMATION DIALOG MODAL */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setConfirmDialog(null)}
          />
          <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 z-10 animate-scale-in">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full shrink-0 ${
                confirmDialog.isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'
              }`}>
                {confirmDialog.isDestructive ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-bold text-slate-900">{confirmDialog.title}</h4>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDialog.onConfirm()}
                className={`px-4 py-2 text-xs font-bold text-white rounded-lg transition-colors shadow-sm cursor-pointer ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmDialog.actionLabel}
              </button>
            </div>
          </div>
        </div>
      )}

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
                    setActiveMenu('Bus Owners')
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
    </div>
  )
}

export default AdminReportsManagement