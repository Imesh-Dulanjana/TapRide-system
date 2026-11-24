import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ChevronLeft,
  ArrowDown,
  Calendar,
  Check,
  ChevronRight,
  Plus,
  Percent,
  CreditCard,
  Minus,
  FileText,
  LayoutGrid,
  Bus,
  BarChart3,
  User,
  X,
  Building,
  CheckCircle2
} from 'lucide-react'

interface SettlementRecord {
  id: string
  period: string
  grossRevenue: number
  deductions: number
  netAmount: number
  journeys: number
  status: 'READY' | 'PAID' | 'PROCESSING'
  disbursementDate?: string
  bankReference?: string
}

export const SettlementSummary: React.FC = () => {
  const navigate = useNavigate()

  // State
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(0)
  const [showPeriodModal, setShowPeriodModal] = useState<boolean>(false)
  const [showExportModal, setShowExportModal] = useState<boolean>(false)
  const [showBankModal, setShowBankModal] = useState<boolean>(false)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)

  // Settlement Cycles (Route 81: Anuradhapura - Polonnaruwa Fleet Operations)
  const settlementCycles: SettlementRecord[] = [
    {
      id: 'ST-20260829',
      period: 'Aug 23, 2026 — Aug 29, 2026',
      grossRevenue: 312450,
      deductions: 13710,
      netAmount: 298740,
      journeys: 1284,
      status: 'READY',
      bankReference: 'BOC-NC-99214'
    },
    {
      id: 'ST-20260822',
      period: 'Aug 16 — Aug 22, 2026',
      grossRevenue: 298100,
      deductions: 13180,
      netAmount: 284920,
      journeys: 1190,
      status: 'PAID',
      disbursementDate: 'Aug 24, 2026',
      bankReference: 'BOC-NC-98402'
    },
    {
      id: 'ST-20260815',
      period: 'Aug 09 — Aug 15, 2026',
      grossRevenue: 284300,
      deductions: 12720,
      netAmount: 271580,
      journeys: 1145,
      status: 'PAID',
      disbursementDate: 'Aug 17, 2026',
      bankReference: 'BOC-NC-97811'
    },
    {
      id: 'ST-20260808',
      period: 'Aug 02 — Aug 08, 2026',
      grossRevenue: 305600,
      deductions: 13450,
      netAmount: 292150,
      journeys: 1240,
      status: 'PAID',
      disbursementDate: 'Aug 10, 2026',
      bankReference: 'BOC-NC-97103'
    }
  ]

  const current = settlementCycles[selectedPeriodIndex]

  // Calculated Breakdown for Current Cycle
  const taprideServiceFee = Math.round(current.grossRevenue * 0.03) // 3% fee
  const processingFee = 3336
  const otherAdjustments = 1000

  // Handle Export Statement Download
  const handleDownloadStatement = (format: 'PDF' | 'CSV') => {
    setExportSuccess(`Settlement statement ${current.id}.${format.toLowerCase()} downloaded.`)
    setShowExportModal(false)
    setTimeout(() => setExportSuccess(null), 4000)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6 select-none font-sans">
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-screen sm:min-h-[844px] relative border border-slate-200">
        
        {/* Top Header Matching Figure C.15 */}
        <header className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-20">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors shadow-xs"
            title="Go back"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5" />
          </button>

          <div className="flex items-center gap-2">
            <img
              src="/logo.jpeg"
              alt="TapRide Logo"
              className="w-7 h-7 rounded-lg object-contain border border-slate-100 shrink-0"
            />
            <div className="text-left">
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Settlement Summary</h1>
              <p className="text-[10px] text-slate-400 font-medium">Bus Owner · TapRide</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="w-9 h-9 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 transition-colors shadow-xs"
            title="Download Settlement Statement"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </header>

        {/* Main Body */}
        <main className="flex-1 px-5 py-4 space-y-3.5 pb-20 overflow-y-auto">
          
          {/* Headline */}
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Settlement Summary</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your TapRide earnings, deductions, and settlement history.
            </p>
          </div>

          {/* Toast Notification */}
          {exportSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}

          {/* Settlement Period Selector Card */}
          <button
            type="button"
            onClick={() => setShowPeriodModal(true)}
            className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-3 flex items-center justify-between text-left transition-colors shadow-xs"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                  SETTLEMENT PERIOD
                </span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">
                  {current.period}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Settlement Status Card */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-emerald-950">
                  {current.status === 'READY' ? 'Settlement Ready' : 'Settlement Disbursed'}
                </h3>
                <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                  {current.status === 'READY'
                    ? 'Your earnings have been verified and are ready for settlement.'
                    : `Disbursed to registered bank account on ${current.disbursementDate}.`}
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
              {current.status}
            </span>
          </div>

          {/* Net Settlement Amount Hero Card (Royal Blue Matching Wireframe) */}
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-3xl p-5 text-white shadow-md relative overflow-hidden space-y-3.5">
            {/* Background ambient lighting */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                NET SETTLEMENT AMOUNT
              </span>
              <div className="text-3xl font-black tracking-tight text-white mt-1">
                Rs. {current.netAmount.toLocaleString()}
              </div>
              <button
                type="button"
                onClick={() => setShowBankModal(true)}
                className="text-[11px] text-blue-200 hover:text-white mt-0.5 flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
              >
                <span>Amount payable to your registered bank account.</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-blue-400/30 pt-3 grid grid-cols-3 gap-2 text-left">
              <div>
                <span className="text-[9px] uppercase font-semibold text-blue-200 block">GROSS REVENUE</span>
                <span className="text-xs font-bold text-white block mt-0.5">
                  Rs. {current.grossRevenue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-blue-200 block">DEDUCTIONS</span>
                <span className="text-xs font-bold text-white block mt-0.5">
                  Rs. {current.deductions.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[9px] uppercase font-semibold text-blue-200 block">JOURNEYS</span>
                <span className="text-xs font-bold text-white block mt-0.5">
                  {current.journeys.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Settlement Breakdown Card Matching Figure C.15 */}
          <section className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-bold text-slate-900">Settlement Breakdown</h3>
              <span className="text-[11px] font-semibold text-slate-400">This period</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
              {/* Item 1: Gross Fare Revenue */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Plus className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Gross Fare Revenue</div>
                    <div className="text-[10px] text-slate-400">{current.journeys.toLocaleString()} journeys</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-900">
                  Rs. {current.grossRevenue.toLocaleString()}
                </div>
              </div>

              {/* Item 2: TapRide Service Fee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Percent className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">TapRide Service Fee</div>
                    <div className="text-[10px] text-slate-400">3.0% platform fee</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-rose-600">
                  - Rs. {taprideServiceFee.toLocaleString()}
                </div>
              </div>

              {/* Item 3: Payment Processing Fee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Payment Processing Fee</div>
                    <div className="text-[10px] text-slate-400">Processing charges</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-rose-600">
                  - Rs. {processingFee.toLocaleString()}
                </div>
              </div>

              {/* Item 4: Other Adjustments */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <Minus className="w-4 h-4 text-slate-600" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Other Adjustments</div>
                    <div className="text-[10px] text-slate-400">RTSA Provincial levy</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-rose-600">
                  - Rs. {otherAdjustments.toLocaleString()}
                </div>
              </div>

              {/* Dashed Total Line */}
              <div className="border-t border-dashed border-slate-200 pt-2.5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">Net Settlement</span>
                <span className="text-base font-black text-blue-600">
                  Rs. {current.netAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </section>

          {/* Settlement History Section */}
          <section className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-bold text-slate-900">Settlement History</h3>
              <button
                type="button"
                onClick={() => setShowPeriodModal(true)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>

            <div className="space-y-2">
              {settlementCycles.slice(1).map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                      <Check className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.period}</div>
                      <div className="text-[10px] text-slate-400">
                        Settlement ID • {item.id}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      Rs. {item.netAmount.toLocaleString()}
                    </div>
                    <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mt-0.5">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Modal: Period Selector */}
        {showPeriodModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Select Settlement Period</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {settlementCycles.map((cycle, idx) => (
                  <button
                    key={cycle.id}
                    type="button"
                    onClick={() => {
                      setSelectedPeriodIndex(idx)
                      setShowPeriodModal(false)
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      idx === selectedPeriodIndex
                        ? 'border-blue-600 bg-blue-50/60 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{cycle.period}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{cycle.id}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-slate-900">
                        Rs. {cycle.netAmount.toLocaleString()}
                      </div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        {cycle.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowPeriodModal(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Modal: Export Statement */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3.5 text-center">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Export Statement</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-500 text-left">
                Download the official settlement summary statement for period <strong>{current.period}</strong>.
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleDownloadStatement('PDF')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <ArrowDown className="w-4 h-4" />
                  <span>Download Official PDF Statement</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadStatement('CSV')}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>Download Excel/CSV Spreadsheet</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Bank Account Drawer */}
        {showBankModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Building className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Registered Bank Details</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Bank Name</span>
                    <span className="font-bold text-slate-900">Bank of Ceylon (BOC)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Branch</span>
                    <span className="font-bold text-slate-900">Anuradhapura City Branch</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Account Name</span>
                    <span className="font-bold text-slate-900">Rajarata Express Bus Lines</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">Account Number</span>
                    <span className="font-mono font-bold text-slate-900">•••• 4829</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBankModal(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation Bar Matching Figure C.15 */}
        <nav className="absolute bottom-0 inset-x-0 bg-white border-t border-slate-200 px-6 py-2.5 flex items-center justify-around z-20">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] font-medium">Dashboard</span>
          </Link>

          <button
            type="button"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Bus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Fleet</span>
          </button>

          <Link
            to="/owner/settlements"
            className="flex flex-col items-center gap-1 text-blue-600 font-semibold"
          >
            <div className="relative">
              <BarChart3 className="w-5 h-5" />
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full absolute -top-1 -right-1" />
            </div>
            <span className="text-[10px]">Reports</span>
          </Link>

          <button
            type="button"
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

export default SettlementSummary
