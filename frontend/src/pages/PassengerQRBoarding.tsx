import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
import {
  ChevronLeft,
  HelpCircle,
  Bus,
  Keyboard,
  X,
  ScanLine,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Check,
  Zap,
  ZapOff,
  ChevronDown
} from 'lucide-react'

// Official North Central Province Corridor Halts (Route 81: Anuradhapura - Polonnaruwa)
const ROUTE_NCP_STOPS = [
  'Anuradhapura (New Town)',
  'Mihintale Junction',
  'Maradankadawala',
  'Kekirawa Town',
  'Habarana Junction',
  'Minneriya',
  'Hingurakgoda',
  'Giritale',
  'Polonnaruwa Old Town',
  'Kaduruwela (Polonnaruwa Central)'
]

const calculateFare = (from: string, to: string): number => {
  const fromIdx = ROUTE_NCP_STOPS.indexOf(from)
  const toIdx = ROUTE_NCP_STOPS.indexOf(to)
  const stages = Math.abs(toIdx - fromIdx)
  if (stages <= 0) return 30
  const fareTable: { [key: number]: number } = {
    1: 30,
    2: 45,
    3: 60,
    4: 80,
    5: 105,
    6: 130,
    7: 160,
    8: 190,
    9: 220
  }
  return fareTable[stages] || 30 + stages * 22
}

interface ActiveJourneyState {
  busPlate: string
  route: string
  fromStop: string
  toStop: string
  fare: number
  boardTime: string
  ticketNumber: string
}

export const PassengerQRBoarding: React.FC = () => {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Mode Selection: "Scan Vehicle QR" (default per wireframe) or "Show My Boarding Pass"
  const [activeTab, setActiveTab] = useState<'scan' | 'my-pass'>('scan')

  // Camera & Device states
  const [cameraActive, setCameraActive] = useState<boolean>(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false)

  // Modals & User Feedback
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false)
  const [showManualModal, setShowManualModal] = useState<boolean>(false)
  const [manualCodeInput, setManualCodeInput] = useState<string>('NB-4521')
  const [selectedFrom, setSelectedFrom] = useState<string>('Anuradhapura (New Town)')
  const [selectedTo, setSelectedTo] = useState<string>('Kaduruwela (Polonnaruwa Central)')

  // Boarding Validation States
  const [activeJourney, setActiveJourney] = useState<ActiveJourneyState | null>(null)
  const [isBoardingProcessing, setIsBoardingProcessing] = useState<boolean>(false)

  // Passenger Digital Pass Security Counter (Refreshes token every 30s)
  const [passCountdown, setPassCountdown] = useState<number>(30)
  const passengerToken = 'TR-2048|BUS-NC4521|FARE-NCP'

  useEffect(() => {
    const timer = setInterval(() => {
      setPassCountdown((prev) => (prev <= 1 ? 30 : prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Audio Confirmation Beep
  const playValidationBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch {
      // Audio fallback
    }
  }

  // Camera Activation
  const startCamera = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access unavailable.'
      setCameraError(message)
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  // Flash Toggle
  const toggleFlash = async () => {
    const nextState = !isFlashOn
    setIsFlashOn(nextState)
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0]
      if (track && 'applyConstraints' in track) {
        try {
          await (track as MediaStreamTrack & {
            applyConstraints: (c: { advanced: Array<{ torch?: boolean }> }) => Promise<void>
          }).applyConstraints({
            advanced: [{ torch: nextState }]
          })
        } catch {
          // Flash not supported
        }
      }
    }
  }

  // Live Camera Scan Loop
  useEffect(() => {
    if (activeTab !== 'scan') {
      stopCamera()
      return
    }

    startCamera()
    let animationFrameId: number
    let isProcessing = false
    let lastTime = 0

    const scanFrame = async (timestamp: number) => {
      if (activeJourney) {
        animationFrameId = requestAnimationFrame(scanFrame)
        return
      }

      const video = videoRef.current
      const canvas = canvasRef.current

      if (
        !isProcessing &&
        video &&
        video.readyState === video.HAVE_ENOUGH_DATA &&
        canvas &&
        timestamp - lastTime > 80
      ) {
        isProcessing = true
        lastTime = timestamp

        try {
          let payload: string | null = null

          // Pass 0: Hardware-accelerated BarcodeDetector
          if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
            try {
              const detector = new (window as unknown as {
                BarcodeDetector: new (opt: { formats: string[] }) => {
                  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>
                }
              }).BarcodeDetector({ formats: ['qr_code'] })
              const barcodes = await detector.detect(video)
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                payload = barcodes[0].rawValue
              }
            } catch {
              // Fallback to jsQR
            }
          }

          // Pass 1: jsQR Center-Crop
          if (!payload) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (ctx) {
              const vw = video.videoWidth
              const vh = video.videoHeight
              const crop = Math.floor(Math.min(vw, vh) * 0.75)
              const x = Math.floor((vw - crop) / 2)
              const y = Math.floor((vh - crop) / 2)

              canvas.width = crop
              canvas.height = crop
              ctx.drawImage(video, x, y, crop, crop, 0, 0, crop, crop)
              const imgData = ctx.getImageData(0, 0, crop, crop)
              const code = jsQR(imgData.data, crop, crop, { inversionAttempts: 'attemptBoth' })
              if (code && code.data) {
                payload = code.data
              }
            }
          }

          if (payload) {
            handleValidateVehicleQR(payload)
          }
        } finally {
          isProcessing = false
        }
      }

      animationFrameId = requestAnimationFrame(scanFrame)
    }

    animationFrameId = requestAnimationFrame(scanFrame)

    return () => {
      stopCamera()
      cancelAnimationFrame(animationFrameId)
    }
  }, [activeTab, activeJourney])

  // Process and Validate Scanned Vehicle QR
  const handleValidateVehicleQR = (rawPayload: string) => {
    if (isBoardingProcessing || activeJourney) return
    setIsBoardingProcessing(true)

    // Parse Bus details (Supports standard TapRide format: BUS-NC4521 or plate tokens)
    let detectedPlate = 'NC NB-4521'
    const plateMatch = rawPayload.match(/NB-?\d{4}|NC-?\d{4}|BUS-[A-Z0-9]+/i)
    if (plateMatch) {
      detectedPlate = plateMatch[0].toUpperCase().replace('BUS-', 'NC ')
    }

    const fare = calculateFare(selectedFrom, selectedTo)
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const ticketId = `TKT-${Math.floor(100000 + Math.random() * 900000)}`

    playValidationBeep()
    if ('vibrate' in navigator) {
      navigator.vibrate([80, 40, 80])
    }

    const journey: ActiveJourneyState = {
      busPlate: detectedPlate,
      route: 'Route 81: Anuradhapura ↔ Polonnaruwa',
      fromStop: selectedFrom,
      toStop: selectedTo,
      fare: fare,
      boardTime: timeStr,
      ticketNumber: ticketId
    }

    setActiveJourney(journey)
    setIsBoardingProcessing(false)
  }

  // Submit Manual Vehicle Code
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCodeInput.trim()) return
    handleValidateVehicleQR(manualCodeInput.trim())
    setShowManualModal(false)
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6 select-none font-sans">
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-screen sm:min-h-[844px] relative border border-slate-200">
        
        {/* Hidden Canvas for QR video frame decoding */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top App Header Matching Figure C.5 */}
        <header className="px-5 pt-4 pb-2 flex items-center justify-between border-b border-slate-100">
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
              className="w-6 h-6 rounded-md object-contain border border-slate-100 shrink-0"
            />
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">QR Boarding</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="w-9 h-9 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors shadow-xs"
            title="Boarding Guide & Help"
          >
            <HelpCircle className="w-4 h-4 text-slate-600" />
          </button>
        </header>

        {/* Mode Toggle Pills (Scan Bus QR vs Show Pass) */}
        <div className="px-5 pt-3">
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('scan')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'scan'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Scan Vehicle QR
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my-pass')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'my-pass'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              My Digital Pass
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 px-5 py-4 flex flex-col justify-between space-y-4">
          
          {activeTab === 'scan' ? (
            <>
              {/* Headline Matching Figure C.5 */}
              <div className="text-center pt-1">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Scan to Board</h2>
                <p className="text-xs text-slate-500 max-w-[280px] mx-auto mt-1 leading-relaxed">
                  Scan the TapRide QR code inside the vehicle to start your journey.
                </p>
              </div>

              {/* Viewfinder or Active Journey Result */}
              {activeJourney ? (
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-6 text-center space-y-4 shadow-sm animate-fadeIn">
                  <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                      Boarding Verified • Journey Active
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-2">{activeJourney.busPlate}</h3>
                    <p className="text-xs font-semibold text-blue-700 mt-0.5">{activeJourney.route}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-emerald-100 text-left space-y-2 text-xs">
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Boarding Halt</span>
                      <span className="font-bold text-slate-800">{activeJourney.fromStop}</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Destination</span>
                      <span className="font-bold text-slate-800">{activeJourney.toStop}</span>
                    </div>
                    <div className="flex justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-slate-500">Boarding Time</span>
                      <span className="font-semibold text-slate-700">{activeJourney.boardTime}</span>
                    </div>
                    <div className="flex justify-between pt-0.5">
                      <span className="text-slate-500">Fare Deducted</span>
                      <span className="font-black text-emerald-600 text-sm">Rs. {activeJourney.fare.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      View Live Trip in Dashboard
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveJourney(null)}
                      className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Scan Another Vehicle
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Viewfinder Card with Subtle Glow and Brackets */}
                  <div className="relative bg-slate-50/90 border border-slate-200/90 rounded-3xl p-6 min-h-[330px] flex flex-col items-center justify-between overflow-hidden shadow-xs">
                    
                    {/* Background ambient radial circles */}
                    <div className="absolute -top-10 -left-10 w-44 h-44 bg-blue-100/60 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-100/70 rounded-full blur-2xl pointer-events-none" />

                    {/* Live Video Element */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 rounded-3xl ${
                        cameraActive ? 'opacity-85' : 'opacity-0'
                      }`}
                    />

                    {/* Frame Helper Text */}
                    <span className="text-xs font-medium text-slate-500 z-10 drop-shadow-xs">
                      Position the QR code inside the frame
                    </span>

                    {/* Center Scanning Frame with Blue Corner Brackets and Matrix Chip */}
                    <div className="relative w-56 h-56 flex items-center justify-center my-auto z-10 overflow-hidden">
                      {/* Four Blue Corner Brackets */}
                      <div className="absolute top-0 left-0 w-9 h-9 border-t-4 border-l-4 border-blue-600 rounded-tl-2xl pointer-events-none" />
                      <div className="absolute top-0 right-0 w-9 h-9 border-t-4 border-r-4 border-blue-600 rounded-tr-2xl pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-9 h-9 border-b-4 border-l-4 border-blue-600 rounded-bl-2xl pointer-events-none" />
                      <div className="absolute bottom-0 right-0 w-9 h-9 border-b-4 border-r-4 border-blue-600 rounded-br-2xl pointer-events-none" />

                      {/* Viewfinder Fallback when camera is not granted */}
                      {!cameraActive && (
                        <div className="text-slate-400 flex flex-col items-center justify-center p-4 text-center">
                          <ScanLine className="w-14 h-14 opacity-30 text-blue-600 mb-1" />
                          <span className="text-[11px] text-slate-500 max-w-[160px] leading-tight">
                            {cameraError || 'Camera preview ready. Align QR or enter code manually.'}
                          </span>
                        </div>
                      )}

                      {/* Moving Horizontal Laser Scanning Line with Center Matrix Chip */}
                      <div
                        className="absolute left-3 right-3 flex items-center justify-center pointer-events-none z-20"
                        style={{ animation: 'laserPassengerUpDown 2.4s ease-in-out infinite' }}
                      >
                        <div className="w-full h-0.5 bg-blue-600 rounded-full shadow-[0_0_10px_#2563eb]" />
                        <div className="absolute w-10 h-10 rounded-xl bg-white shadow-md border border-blue-200 flex items-center justify-center">
                          <QrCode className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <style>{`
                        @keyframes laserPassengerUpDown {
                          0% { top: 12px; }
                          50% { top: calc(100% - 24px); }
                          100% { top: 12px; }
                        }
                      `}</style>
                    </div>

                    {/* Camera Ready Floating Pill */}
                    <div className="z-10 flex items-center gap-2">
                      <div className="bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1 rounded-full text-xs font-semibold text-slate-700 flex items-center gap-2 shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Camera ready</span>
                      </div>
                      {cameraActive && (
                        <button
                          type="button"
                          onClick={toggleFlash}
                          className="bg-white/95 p-1 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs"
                          title="Toggle Flash"
                        >
                          {isFlashOn ? <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> : <ZapOff className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Sub-headline Text Matching Wireframe */}
                  <div className="text-center pt-1">
                    <h3 className="text-base font-bold text-slate-900">Scan the vehicle QR code</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Keep the QR code clearly visible within the scanning frame.
                    </p>
                  </div>

                  {/* Passenger Destination Selector for Scan to Board */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs text-left space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Your Intended Destination</span>
                      <span className="text-[11px] font-semibold text-blue-600">
                        Fare: Rs. {calculateFare(selectedFrom, selectedTo)}
                      </span>
                    </div>
                    <div className="relative">
                      <select
                        value={selectedTo}
                        onChange={(e) => setSelectedTo(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:border-blue-500 pr-8"
                      >
                        {ROUTE_NCP_STOPS.map((stop) => (
                          <option key={stop} value={stop} disabled={stop === selectedFrom}>
                            {stop} {stop === selectedFrom ? '(Current Boarding)' : ''}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  </div>

                  {/* Enter QR Code Manually Button */}
                  <button
                    type="button"
                    onClick={() => setShowManualModal(true)}
                    className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                  >
                    <Keyboard className="w-4 h-4 text-slate-600" />
                    <span>Enter QR code manually</span>
                  </button>
                </>
              )}

              {/* Vehicle / Route Status Card Matching Wireframe */}
              <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">TapRide Bus</h4>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Route 81 · Anuradhapura ↔ Polonnaruwa
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  READY
                </span>
              </div>
            </>
          ) : (
            /* Tab 2: Show My Boarding Pass (For conductor to scan passenger) */
            <div className="space-y-4 pt-1">
              <div className="text-center">
                <h2 className="text-xl font-black text-slate-900">Passenger Digital Pass</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Present this QR code to the bus conductor to validate boarding.
                </p>
              </div>

              {/* Digital QR Pass Card */}
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm text-center space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 text-xs">
                  <div className="text-left">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Passenger</span>
                    <div className="font-bold text-slate-900">Dulanjana (TR-2048)</div>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Wallet Balance</span>
                    <div className="font-bold text-emerald-600">Rs. 850.00</div>
                  </div>
                </div>

                {/* Dynamic QR Code Display */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 inline-block shadow-inner">
                  <div className="w-52 h-52 bg-white p-3 rounded-xl shadow-xs border border-slate-200 mx-auto flex items-center justify-center">
                    <img
                      src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUoAAAFKAQAAAABTUiuoAAACNElEQVR4nO2aS6rkMAxFj14CPXSgFpTacu8gWUrvIBk+cLg9sJzPpKkaVMfw5EFI8BlcEIqvZJl4cc1fr5IQaKCBfsFqvp5rj38Om5kNULf6RrQGSidJEqRvgyRpohPjAoySpKUZrYGCZ8/aYzZsxrhspmlPtefHBQT6PpoyJa1m628REOi/1zUq3e4Qu2yk/B8EBPp2tDxI6yPDajAuDxh/9xmSgPVzAgJ9M1qbHd82Lo98+p7Le/cxAYG+F610FMgZYDOVt5Q51863aw0UaenEWBy8pKlYDYrf0JQkxqWTptu1BoqkjMdjj4wWD6OmWn5FtBpAqYWxxOEJS/CocYtoNYRuBquZpuRZxjz4ttnQieLlm9D649H1Vzm3vE/IZoz6rr6wRPCjAgJ9eZXjyc8oNxi1O+gNRN+9XWugVEdBjZHkfgOAURmIc6sN1B380SIcld15nHvwEa0m0EtuLYcJvFr7yK02UHQszy1PJt9PGS+6btca6Cmtah5RTWDaf4fxJ2wDPeeWasjY75NLWpW327UG6rm1l1XVwR9XW7u/v11roNfc2r2F3CJWxxi51QRacwtOrV3//y1dnFttoRwti1pq7Y8lurpNoj7zRCdYe8oUzVyGCqOr2w5aexm11Kol8rl3GOdWk+hqpgmwJz6ry/jHBw1b0/oj0cvMU8p9aV7MQ5fNJzT23du1BvoFbGXWvczqPk/3W53KMPwzcqsN9DrzJPDrfu8T1q1wGYEG+ib6F5217WHrRC1BAAAAAElFTkSuQmCC"
                      alt="Passenger QR Pass"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-2 font-semibold">
                    {passengerToken}
                  </div>
                </div>

                {/* Security Dynamic Refresh Countdown */}
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Refreshes in <strong className="text-slate-800">{passCountdown}s</strong> for security</span>
                </div>

                {/* Stage Info */}
                <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100 text-left text-xs space-y-1">
                  <div className="flex items-center justify-between text-blue-950 font-bold">
                    <span>Route 81: North Central Province</span>
                    <span className="text-blue-700">Rs. {calculateFare(selectedFrom, selectedTo)}</span>
                  </div>
                  <div className="text-[11px] text-blue-800">
                    {selectedFrom} → {selectedTo}
                  </div>
                </div>
              </div>

              {/* Journey Stage Adjuster */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800 flex items-center justify-between">
                  <span>Selected Journey Stage</span>
                  <span className="text-[10px] text-blue-600 font-semibold">TapRide NCP</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Boarding Halt</label>
                    <select
                      value={selectedFrom}
                      onChange={(e) => setSelectedFrom(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-[11px] font-semibold text-slate-800"
                    >
                      {ROUTE_NCP_STOPS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Destination</label>
                    <select
                      value={selectedTo}
                      onChange={(e) => setSelectedTo(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-1.5 text-[11px] font-semibold text-slate-800"
                    >
                      {ROUTE_NCP_STOPS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Secure Boarding Verification Footer Note */}
          <footer className="pt-1 pb-2 text-center">
            <p className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Secure boarding verification</span>
            </p>
          </footer>
        </main>

        {/* Modal: Manual Entry */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Keyboard className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Enter Vehicle QR Code</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Bus Plate or Vehicle Code
                  </label>
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="e.g. NB-4521"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 uppercase"
                    autoFocus
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Located on the vehicle QR poster inside the bus entrance.
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="text-[10px] font-bold text-slate-600 uppercase">Selected Trip Route</div>
                  <div className="font-bold text-blue-900">
                    {selectedFrom} → {selectedTo}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Provincial Tariff: <strong className="text-slate-900">Rs. {calculateFare(selectedFrom, selectedTo)}.00</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="flex-1 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                  >
                    Confirm Boarding
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Boarding Guidance & Help */}
        {showHelpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">QR Boarding Instructions</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-600">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <strong className="text-slate-900 block mb-0.5">1. Scan Vehicle QR</strong>
                  Point your camera at the official TapRide QR code card mounted near the bus door.
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <strong className="text-slate-900 block mb-0.5">2. Or Present Your Pass</strong>
                  Switch to "My Digital Pass" tab if the conductor uses a mobile terminal to validate your ticket.
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <strong className="text-slate-900 block mb-0.5">3. Instant Digital Verification</strong>
                  The provincial tariff is deducted automatically from your digital wallet and recorded in your journey history.
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-full py-2.5 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default PassengerQRBoarding
