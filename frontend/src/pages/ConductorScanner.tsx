import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Bus,
  Zap,
  ZapOff,
  Keyboard,
  Info,
  CheckCircle2,
  LayoutGrid,
  QrCode,
  History,
  User,
  X,
  ScanLine,
  Check,
  AlertCircle
} from 'lucide-react'

interface ScannedRecord {
  passengerId: string
  scanTime: string
  fare: number
  status: string
  route: string
}

export const ConductorScanner: React.FC = () => {
  const navigate = useNavigate()
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(true)
  const [showManualModal, setShowManualModal] = useState<boolean>(false)
  const [manualPassengerId, setManualPassengerId] = useState<string>('')
  const [manualFare, setManualFare] = useState<string>('52.00')
  const [scanFeedback, setScanFeedback] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState<boolean>(false)

  const [lastScan, setLastScan] = useState<ScannedRecord>({
    passengerId: 'Passenger TR-2048',
    scanTime: '11:10 AM',
    fare: 52,
    status: 'PAID',
    route: 'Route 138'
  })

  // Simulated scan action for demonstration and automated testing
  const handleSimulateScan = (passengerIdOverride?: string, fareOverride?: number) => {
    setIsScanning(true)
    setTimeout(() => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      const id = passengerIdOverride || `Passenger TR-${Math.floor(1000 + Math.random() * 9000)}`
      const fare = fareOverride !== undefined ? fareOverride : 52

      const newRecord: ScannedRecord = {
        passengerId: id,
        scanTime: timeStr,
        fare: fare,
        status: 'PAID',
        route: 'Route 138'
      }

      setLastScan(newRecord)
      setIsScanning(false)
      setScanFeedback(`Successfully validated ${id} (Rs. ${fare.toFixed(2)})`)

      setTimeout(() => {
        setScanFeedback(null)
      }, 3500)
    }, 600)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualPassengerId.trim()) return

    const fareNum = parseFloat(manualFare) || 52
    handleSimulateScan(
      manualPassengerId.startsWith('TR-') ? `Passenger ${manualPassengerId}` : manualPassengerId,
      fareNum
    )
    setManualPassengerId('')
    setShowManualModal(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6">
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-screen sm:min-h-[844px] relative border border-slate-200">
        
        {/* Top App Header */}
        <header className="px-5 pt-5 pb-3 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-20">
          <button
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h1 className="text-base font-bold text-slate-900 leading-tight">Conductor Scanner</h1>
            <p className="text-[11px] text-slate-500 font-medium">TapRide Conductor</p>
          </div>

          {/* Online/Offline Status Indicator */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            title="Click to toggle network state for testing"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors border ${
              isOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </button>
        </header>

        {/* Scrollable Content Body */}
        <main className="flex-1 px-5 py-4 overflow-y-auto pb-24 space-y-4">
          
          {/* Notification Toast */}
          {scanFeedback && (
            <div className="bg-emerald-600 text-white text-xs px-3.5 py-2.5 rounded-xl shadow-md flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span className="font-medium">{scanFeedback}</span>
              </div>
              <button onClick={() => setScanFeedback(null)}>
                <X className="w-3.5 h-3.5 text-white/80 hover:text-white" />
              </button>
            </div>
          )}

          {/* Assigned Bus Details Card */}
          <section className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  NB-4521 <span className="text-slate-400 font-normal">•</span> Route 138
                </div>
                <div className="text-xs text-slate-500 font-medium">Colombo → Kaduwela</div>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              ON ROUTE
            </span>
          </section>

          {/* Scanner Headline */}
          <div className="text-center pt-1">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Scan Passenger QR</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
              Scan the passenger's QR code to validate boarding and fare payment.
            </p>
          </div>

          {/* Camera Viewfinder Box */}
          <section className="bg-slate-950 rounded-3xl p-5 text-center relative overflow-hidden shadow-inner flex flex-col items-center justify-between min-h-[340px] border border-slate-800">
            {/* Header label inside viewfinder */}
            <div className="w-full flex items-center justify-between">
              <span className="text-[10px] tracking-widest text-slate-400 uppercase font-semibold">
                Camera Scanner
              </span>
              <button
                onClick={() => handleSimulateScan()}
                disabled={isScanning}
                className="text-[10px] bg-blue-600/80 hover:bg-blue-600 text-white font-medium px-2 py-0.5 rounded-md transition-colors"
              >
                {isScanning ? 'Validating...' : 'Simulate Scan'}
              </button>
            </div>

            {/* Target Scanning Frame */}
            <div className="relative w-52 h-52 flex items-center justify-center my-auto">
              {/* Corner brackets matching Figma design */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl" />

              {/* Viewfinder background grid icon */}
              <div className="text-slate-800 flex flex-col items-center justify-center">
                <ScanLine className="w-20 h-20 opacity-30 text-slate-500" />
              </div>

              {/* Laser Animation Bar */}
              <div className="absolute inset-x-4 h-0.5 bg-blue-400 shadow-[0_0_12px_#60a5fa] animate-pulse" />
            </div>

            {/* Frame Helper Text */}
            <p className="text-xs text-slate-400 font-medium mb-3">
              Align the QR code inside the frame
            </p>

            {/* Viewfinder Action Buttons: Flash & Manual Entry */}
            <div className="flex items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={() => setIsFlashOn(!isFlashOn)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all border ${
                  isFlashOn
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                    : 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700'
                }`}
              >
                {isFlashOn ? <Zap className="w-4 h-4 fill-slate-950" /> : <ZapOff className="w-4 h-4" />}
                <span>{isFlashOn ? 'Flash On' : 'Flash'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 transition-colors shadow-sm"
              >
                <Keyboard className="w-4 h-4 text-slate-700" />
                <span>Manual Entry</span>
              </button>
            </div>
          </section>

          {/* Boarding Validation Guidance Banner */}
          <section className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-blue-950">Boarding validation</h3>
              <p className="text-[11px] text-blue-800/90 mt-0.5 leading-relaxed">
                Make sure the passenger's QR code is clearly visible. The system will validate the QR
                and record the boarding transaction.
              </p>
            </div>
          </section>

          {/* Last Successful Scan Card */}
          <section className="pt-1">
            <h3 className="text-xs font-bold text-slate-800 mb-2">Last Successful Scan</h3>
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{lastScan.passengerId}</div>
                  <div className="text-xs text-slate-500">
                    QR validated • {lastScan.scanTime}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">
                  Rs. {lastScan.fare.toFixed(0)}
                </div>
                <span className="inline-block text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full mt-0.5">
                  {lastScan.status}
                </span>
              </div>
            </div>
          </section>
        </main>

        {/* Modal: Manual Passenger Entry */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Manual Fare Entry</h3>
                </div>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Passenger ID / NIC / Mobile
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TR-2048 or 199834502841"
                    value={manualPassengerId}
                    onChange={(e) => setManualPassengerId(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fare Amount (LKR)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={manualFare}
                    onChange={(e) => setManualFare(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl text-[11px] text-slate-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Manual fallback records will sync automatically when online.</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                  >
                    Validate & Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-around z-20">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>

          <Link
            to="/conductor/scanner"
            className="flex flex-col items-center gap-1 text-blue-600 font-semibold"
          >
            <div className="relative">
              <QrCode className="w-5 h-5" />
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute -top-1 -right-1" />
            </div>
            <span className="text-[10px]">Scanner</span>
          </Link>

          <button
            type="button"
            onClick={() => setScanFeedback('Conductor Journey History: 186 passengers validated today.')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium">History</span>
          </button>

          <button
            type="button"
            onClick={() => setScanFeedback('Conductor Profile: Kasun Perera (ID: C-402)')}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </nav>

      </div>
    </div>
  )
}

export default ConductorScanner
