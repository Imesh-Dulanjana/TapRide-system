import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import jsQR from 'jsqr'
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
  AlertCircle,
  RefreshCw,
  Clock,
  MapPin,
  ArrowLeftRight,
  Navigation,
  Upload
} from 'lucide-react'

// Standard Stage Halts on Route 81 (North Central Province: Anuradhapura - Polonnaruwa Corridor)
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

// Dynamic Distance/Stage-Based Fare Calculator (North Central Province Tariff Scale)
const calculateFare = (from: string, to: string): number => {
  const fromIdx = ROUTE_NCP_STOPS.indexOf(from)
  const toIdx = ROUTE_NCP_STOPS.indexOf(to)
  const stages = Math.abs(toIdx - fromIdx)
  if (stages <= 0) return 30 // Minimum stop fare
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

interface ScannedRecord {
  passengerId: string
  scanTime: string
  fare: number
  status: string
  route: string
  fromStop?: string
  toStop?: string
}

export const ConductorScanner: React.FC = () => {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const lastScannedTimeRef = useRef<number>(0)

  // Camera & Device states
  const [cameraActive, setCameraActive] = useState<boolean>(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isFlashOn, setIsFlashOn] = useState<boolean>(false)
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine)

  // Journey & Route Stage Selection (North Central Province)
  const [busDirection, setBusDirection] = useState<'Anuradhapura → Polonnaruwa' | 'Polonnaruwa → Anuradhapura'>('Anuradhapura → Polonnaruwa')
  const [fromStop, setFromStop] = useState<string>('Anuradhapura (New Town)')
  const [toStop, setToStop] = useState<string>('Kaduruwela (Polonnaruwa Central)')
  const [currentFare, setCurrentFare] = useState<number>(220)

  // Scanning & UI states
  const [isScanning, setIsScanning] = useState<boolean>(false)
  const [scanSuccessAnim, setScanSuccessAnim] = useState<boolean>(false)
  const [scanFeedback, setScanFeedback] = useState<string | null>(null)

  // Modals
  const [showManualModal, setShowManualModal] = useState<boolean>(false)
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false)
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false)
  const [showSampleQRModal, setShowSampleQRModal] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Manual entry inputs
  const [manualPassengerId, setManualPassengerId] = useState<string>('')
  const [manualFare, setManualFare] = useState<string>('220.00')

  // Scanned history list & last scan
  const [scanHistory, setScanHistory] = useState<ScannedRecord[]>([
    {
      passengerId: 'Passenger TR-2048',
      scanTime: '11:10 AM',
      fare: 45,
      status: 'PAID',
      route: 'Route 81',
      fromStop: 'Anuradhapura (New Town)',
      toStop: 'Mihintale Junction'
    },
    {
      passengerId: 'Passenger TR-1992',
      scanTime: '10:54 AM',
      fare: 105,
      status: 'PAID',
      route: 'Route 81',
      fromStop: 'Habarana Junction',
      toStop: 'Kaduruwela (Polonnaruwa Central)'
    },
    {
      passengerId: 'Passenger TR-1874',
      scanTime: '10:21 AM',
      fare: 60,
      status: 'PAID',
      route: 'Route 81',
      fromStop: 'Minneriya',
      toStop: 'Polonnaruwa Old Town'
    }
  ])

  const lastScan = scanHistory[0]

  // Recalculate fare whenever From or To stops change
  useEffect(() => {
    const f = calculateFare(fromStop, toStop)
    setCurrentFare(f)
    setManualFare(f.toFixed(2))
  }, [fromStop, toStop])

  // Advance bus to next stop along the route
  const handleAdvanceNextHalt = () => {
    const currentIdx = ROUTE_NCP_STOPS.indexOf(fromStop)
    if (busDirection === 'Anuradhapura → Polonnaruwa') {
      if (currentIdx < ROUTE_NCP_STOPS.length - 1) {
        setFromStop(ROUTE_NCP_STOPS[currentIdx + 1])
      }
    } else {
      if (currentIdx > 0) {
        setFromStop(ROUTE_NCP_STOPS[currentIdx - 1])
      }
    }
  }

  // Swap From & To stops
  const handleSwapStops = () => {
    const oldFrom = fromStop
    setFromStop(toStop)
    setToStop(oldFrom)
  }

  // Native Audio Synthesizer for Transit Validation Beep
  const playValidationBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime) // High pleasant transit chime
      gain.gain.setValueAtTime(0.12, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.18)
    } catch {
      // Audio fallback
    }
  }

  // Camera Activation via WebRTC MediaDevices
  const startCamera = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
          // @ts-expect-error focusMode is supported on Android & some webcams
          focusMode: { ideal: 'continuous' }
        },
        audio: false
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraActive(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Camera access was blocked or not found.'
      setCameraError(message)
      setCameraActive(false)
    }
  }

  // Stop camera stream cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  // Toggle Camera Flash / Torch
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
          // Torch not supported on some webcams
        }
      }
    }
  }

  // Real-Time Frame Processing with Hybrid BarcodeDetector + jsQR (Anti-Glare & Multi-Pass)
  useEffect(() => {
    startCamera()

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    let animationFrameId: number
    let lastProcessedTime = 0
    let isProcessing = false

    const scanFrame = async (timestamp: number) => {
      const video = videoRef.current
      const canvas = canvasRef.current

      // Process at most once every 75ms for high responsiveness with zero CPU lag
      if (
        !isProcessing &&
        video &&
        video.readyState === video.HAVE_ENOUGH_DATA &&
        canvas &&
        timestamp - lastProcessedTime > 75
      ) {
        isProcessing = true
        lastProcessedTime = timestamp

        try {
          let detectedContent: string | null = null

          // Pass 0: Native browser BarcodeDetector API (hardware-accelerated ML scanner)
          if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
            try {
              const barcodeDetector = new (window as unknown as {
                BarcodeDetector: new (opt: { formats: string[] }) => {
                  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>
                }
              }).BarcodeDetector({ formats: ['qr_code'] })
              const barcodes = await barcodeDetector.detect(video)
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                detectedContent = barcodes[0].rawValue
              }
            } catch {
              // Fallback to jsQR
            }
          }

          // Pass 1 & 2: High-speed jsQR on canvas
          if (!detectedContent) {
            const ctx = canvas.getContext('2d', { willReadFrequently: true })
            if (ctx) {
              const vw = video.videoWidth
              const vh = video.videoHeight

              const cropDim = Math.floor(Math.min(vw, vh) * 0.75)
              const cropX = Math.floor((vw - cropDim) / 2)
              const cropY = Math.floor((vh - cropDim) / 2)

              canvas.width = cropDim
              canvas.height = cropDim

              // 1. Native 1:1 sensor crop (sharpest resolution, no scaling blur)
              ctx.filter = 'none'
              ctx.drawImage(video, cropX, cropY, cropDim, cropDim, 0, 0, cropDim, cropDim)
              let imgData = ctx.getImageData(0, 0, cropDim, cropDim)
              let code = jsQR(imgData.data, cropDim, cropDim, {
                inversionAttempts: 'attemptBoth'
              })

              // 2. Anti-glare contrast boost (cuts through phone screen backlight & reflections)
              if (!code) {
                ctx.filter = 'contrast(160%) brightness(88%)'
                ctx.drawImage(video, cropX, cropY, cropDim, cropDim, 0, 0, cropDim, cropDim)
                imgData = ctx.getImageData(0, 0, cropDim, cropDim)
                code = jsQR(imgData.data, cropDim, cropDim, {
                  inversionAttempts: 'attemptBoth'
                })
              }

              // 3. Wide full-frame fallback
              if (!code) {
                const maxDim = 800
                const scale = Math.min(1, maxDim / Math.max(vw, vh))
                const fw = Math.floor(vw * scale)
                const fh = Math.floor(vh * scale)
                canvas.width = fw
                canvas.height = fh
                ctx.filter = 'none'
                ctx.drawImage(video, 0, 0, fw, fh)
                imgData = ctx.getImageData(0, 0, fw, fh)
                code = jsQR(imgData.data, fw, fh, {
                  inversionAttempts: 'attemptBoth'
                })
              }

              if (code && code.data) {
                detectedContent = code.data
              }
            }
          }

          if (detectedContent) {
            const now = Date.now()
            // 2.5-second debounce between scans
            if (now - lastScannedTimeRef.current > 2500) {
              lastScannedTimeRef.current = now
              handleProcessScan(detectedContent)
            }
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
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Process & Record Scanned Passenger
  const handleProcessScan = (rawContent?: string, fareOverride?: number) => {
    if (isScanning) return
    setIsScanning(true)

    // Parse identifier
    let passengerDisplay = `Passenger TR-${Math.floor(1000 + Math.random() * 9000)}`
    if (rawContent) {
      try {
        const parsed = JSON.parse(rawContent)
        if (parsed.passengerId) passengerDisplay = parsed.passengerId
      } catch {
        if (rawContent.includes('TR-') || rawContent.length < 25) {
          passengerDisplay = rawContent.startsWith('TR-') ? `Passenger ${rawContent}` : rawContent
        } else {
          passengerDisplay = `Passenger TR-${Math.floor(1000 + Math.random() * 9000)}`
        }
      }
    }

    const fare = fareOverride !== undefined ? fareOverride : currentFare
    const now = new Date()
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

    // Play feedback
    playValidationBeep()
    if ('vibrate' in navigator) {
      navigator.vibrate([70, 40, 70])
    }

    setScanSuccessAnim(true)
    setTimeout(() => setScanSuccessAnim(false), 900)

    const newRecord: ScannedRecord = {
      passengerId: passengerDisplay,
      scanTime: timeStr,
      fare: fare,
      status: 'PAID',
      route: 'Route 81',
      fromStop: fromStop,
      toStop: toStop
    }

    setScanHistory((prev) => [newRecord, ...prev])
    setScanFeedback(`Validated ${passengerDisplay} • ${fromStop} → ${toStop} • Fare Rs. ${fare.toFixed(2)} deducted.`)
    setIsScanning(false)

    setTimeout(() => {
      setScanFeedback(null)
    }, 4500)
  }

  // Handle Manual Entry Modal Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualPassengerId.trim()) return

    const parsedFare = parseFloat(manualFare) || currentFare
    handleProcessScan(manualPassengerId.trim(), parsedFare)
    setManualPassengerId('')
    setShowManualModal(false)
  }

  // Handle Fallback Image Upload Scan
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = canvasRef.current
        if (canvas) {
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            const imgData = ctx.getImageData(0, 0, img.width, img.height)
            const code = jsQR(imgData.data, img.width, img.height, {
              inversionAttempts: 'attemptBoth'
            })
            if (code && code.data) {
              handleProcessScan(code.data)
            } else {
              setScanFeedback('Uploaded image did not contain a recognizable standard QR code.')
            }
          }
        }
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center py-0 sm:py-6 select-none font-sans">
      <div className="w-full max-w-md bg-white sm:rounded-3xl shadow-xl overflow-hidden flex flex-col min-h-screen sm:min-h-[844px] relative border border-slate-200">
        
        {/* Hidden Canvas for Live QR Frame Capture */}
        <canvas ref={canvasRef} className="hidden" />

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
            <p className="text-[11px] text-slate-500 font-medium">TapRide Conductor • North Central</p>
          </div>

          {/* Online/Offline Status Indicator */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            title="Click to toggle network state"
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
        <main className="flex-1 px-5 py-4 overflow-y-auto pb-24 space-y-3.5">
          
          {/* Validation Toast Message */}
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

          {/* Assigned Bus Details Card with Direction Toggle */}
          <section className="bg-slate-50 rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">
                  NC NB-4521 <span className="text-slate-400 font-normal">•</span> Route 81
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newDir = busDirection === 'Anuradhapura → Polonnaruwa' ? 'Polonnaruwa → Anuradhapura' : 'Anuradhapura → Polonnaruwa'
                    setBusDirection(newDir)
                    if (newDir === 'Polonnaruwa → Anuradhapura') {
                      setFromStop('Kaduruwela (Polonnaruwa Central)')
                      setToStop('Anuradhapura (New Town)')
                    } else {
                      setFromStop('Anuradhapura (New Town)')
                      setToStop('Kaduruwela (Polonnaruwa Central)')
                    }
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mt-0.5"
                  title="Click to toggle route direction"
                >
                  <span>{busDirection}</span>
                  <ArrowLeftRight className="w-3 h-3 text-blue-500" />
                </button>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              ON ROUTE
            </span>
          </section>

          {/* Passenger Journey Stage & Dynamic Fare Selector */}
          <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-3.5 shadow-md space-y-2.5 border border-blue-900/60">
            <div className="flex items-center justify-between border-b border-blue-800/50 pb-2">
              <div className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                  Select Journey Stage (NCP)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-blue-300 font-medium bg-blue-900/80 px-2 py-0.5 rounded-full border border-blue-700/50">
                  {Math.abs(ROUTE_NCP_STOPS.indexOf(toStop) - ROUTE_NCP_STOPS.indexOf(fromStop)) || 1} Stages
                </span>
                <span className="text-sm font-black text-cyan-300 bg-cyan-950/90 border border-cyan-400/50 px-2.5 py-0.5 rounded-lg shadow-sm">
                  Rs. {currentFare.toFixed(0)}
                </span>
              </div>
            </div>

            {/* Boarding and Destination Selectors with Swap Button */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {/* From Stop */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-blue-300 tracking-wider flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                  From (Boarding)
                </label>
                <select
                  value={fromStop}
                  onChange={(e) => setFromStop(e.target.value)}
                  className="w-full bg-slate-900/90 text-white border border-blue-700/60 rounded-xl px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {ROUTE_NCP_STOPS.map((stop) => (
                    <option key={stop} value={stop} className="bg-slate-900 text-white">
                      {stop}
                    </option>
                  ))}
                </select>
              </div>

              {/* Swap Button */}
              <div className="pt-3.5 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleSwapStops}
                  title="Swap Boarding and Destination"
                  className="w-7 h-7 rounded-full bg-blue-800/80 hover:bg-blue-700 text-cyan-300 border border-blue-600/60 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                </button>
              </div>

              {/* To Stop */}
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-bold text-blue-300 tracking-wider flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-rose-400" />
                  To (Destination)
                </label>
                <select
                  value={toStop}
                  onChange={(e) => setToStop(e.target.value)}
                  className="w-full bg-slate-900/90 text-white border border-blue-700/60 rounded-xl px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  {ROUTE_NCP_STOPS.map((stop) => (
                    <option key={stop} value={stop} className="bg-slate-900 text-white">
                      {stop}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Destination Stage Pills */}
            <div className="pt-1.5 border-t border-blue-900/40">
              <div className="flex items-center justify-between text-[10px] text-blue-300 mb-1">
                <span className="font-semibold">Quick Stage Target:</span>
                <button
                  type="button"
                  onClick={handleAdvanceNextHalt}
                  className="text-cyan-300 hover:text-cyan-200 font-semibold underline underline-offset-2 flex items-center gap-0.5"
                >
                  Advance Bus Halt →
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROUTE_NCP_STOPS.filter((s) => s !== fromStop)
                  .slice(0, 4)
                  .map((stop) => {
                    const f = calculateFare(fromStop, stop)
                    const isSelected = toStop === stop
                    return (
                      <button
                        key={stop}
                        type="button"
                        onClick={() => setToStop(stop)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-sm font-bold'
                            : 'bg-blue-950/70 hover:bg-blue-800/80 text-blue-200 border-blue-800/60'
                        }`}
                      >
                        {stop.split(' ')[0]} (Rs. {f})
                      </button>
                    )
                  })}
              </div>
            </div>
          </section>

          {/* Scanner Headline */}
          <div className="text-center pt-0.5">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Scan Passenger QR</h2>
            <p className="text-xs text-slate-500 max-w-[300px] mx-auto leading-tight">
              Charges <span className="font-bold text-slate-900">Rs. {currentFare.toFixed(0)}</span> for{' '}
              <span className="text-blue-600 font-semibold">{fromStop.split(' ')[0]} → {toStop.split(' ')[0]}</span>
            </p>
          </div>

          {/* Camera Viewfinder Box with Live Video Feed */}
          <section className="bg-slate-950 rounded-3xl p-5 text-center relative overflow-hidden shadow-inner flex flex-col items-center justify-between min-h-[350px] border border-slate-800">
            
            {/* Live Video Background */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                cameraActive ? 'opacity-70' : 'opacity-0'
              }`}
            />

            {/* Success flash overlay */}
            {scanSuccessAnim && (
              <div className="absolute inset-0 bg-emerald-500/30 backdrop-blur-xs z-20 flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                  <Check className="w-10 h-10" />
                </div>
              </div>
            )}

            {/* Top Viewfinder Controls */}
            <div className="w-full flex items-center justify-between z-10">
              <span className="text-[10px] tracking-widest text-slate-300 uppercase font-semibold drop-shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                Live Camera Scanner
              </span>

              <div className="flex items-center gap-1.5">
                {!cameraActive && (
                  <button
                    onClick={startCamera}
                    className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-2 py-0.5 rounded-md flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry Camera
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSampleQRModal(true)}
                  className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold px-2 py-1 rounded-lg border border-cyan-500/40 transition-colors shadow-sm"
                  title="View standard TapRide passenger boarding QR"
                >
                  Sample QR
                </button>
                <button
                  onClick={() => handleProcessScan()}
                  disabled={isScanning}
                  className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2.5 py-1 rounded-lg transition-colors shadow-sm"
                >
                  {isScanning ? 'Processing...' : 'Simulate Scan'}
                </button>
              </div>
            </div>

            {/* Target Scanning Frame */}
            <div className="relative w-52 h-52 flex items-center justify-center my-auto z-10 overflow-hidden rounded-2xl">
              {/* Corner brackets matching Figma design */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-xl drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] z-20 pointer-events-none" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-xl drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] z-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-xl drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] z-20 pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-xl drop-shadow-[0_0_8px_rgba(96,165,250,0.8)] z-20 pointer-events-none" />

              {/* Viewfinder fallback icon when video is not granted */}
              {!cameraActive && (
                <div className="text-slate-700 flex flex-col items-center justify-center">
                  <ScanLine className="w-20 h-20 opacity-30 text-slate-400" />
                  {cameraError && (
                    <span className="text-[10px] text-slate-400 mt-2 max-w-[170px] leading-tight">
                      Camera preview ready. Tap "Simulate Scan" or allow browser camera permissions.
                    </span>
                  )}
                </div>
              )}

              {/* Laser Scanning Animation Bar - Moving Smoothly Up and Down */}
              <div
                className="absolute left-2 right-2 h-1 bg-cyan-400 rounded-full shadow-[0_0_15px_3px_#38bdf8] pointer-events-none z-30"
                style={{
                  animation: 'laserScanUpDown 2.2s ease-in-out infinite'
                }}
              />
              <style>{`
                @keyframes laserScanUpDown {
                  0% {
                    top: 8px;
                    opacity: 0.7;
                  }
                  50% {
                    top: calc(100% - 12px);
                    opacity: 1;
                  }
                  100% {
                    top: 8px;
                    opacity: 0.7;
                  }
                }
              `}</style>
            </div>

            {/* Frame Helper Text */}
            <p className="text-xs text-slate-300 font-medium mb-3 z-10 drop-shadow-sm">
              Align the QR code inside the frame
            </p>

            {/* Viewfinder Action Buttons: Flash, Manual Entry, and Upload File */}
            <div className="flex items-center justify-center gap-2 w-full z-10">
              <button
                type="button"
                onClick={toggleFlash}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all border ${
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
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-900 transition-colors shadow-sm"
              >
                <Keyboard className="w-4 h-4 text-slate-700" />
                <span>Manual</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 transition-colors shadow-sm"
                title="Upload a QR image file directly"
              >
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800">Last Successful Scan</h3>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700"
              >
                View Log ({scanHistory.length})
              </button>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">{lastScan.passengerId}</div>
                  <div className="text-xs text-blue-700 font-semibold">
                    {lastScan.fromStop || 'Anuradhapura (New Town)'} → {lastScan.toStop || 'Kaduruwela (Polonnaruwa Central)'}
                  </div>
                  <div className="text-[10px] text-slate-400">
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
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-blue-950">Active Journey:</span>
                  <span className="font-semibold text-blue-700">
                    {fromStop.split(' ')[0]} → {toStop.split(' ')[0]}
                  </span>
                </div>

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

        {/* Modal: History / Scanned Passenger Log */}
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <History className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Today's Validated Scans</h3>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-2">
                {scanHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{item.passengerId}</div>
                      <div className="text-[11px] font-semibold text-blue-700">
                        {item.fromStop || 'Anuradhapura (New Town)'} → {item.toStop || 'Kaduruwela (Polonnaruwa Central)'}
                      </div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {item.scanTime} • {item.route}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">Rs. {item.fare.toFixed(0)}</div>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Conductor Profile */}
        {showProfileModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Conductor Profile</h3>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Conductor Name</span>
                  <span className="font-bold text-slate-900">Kasun Perera</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Crew ID</span>
                  <span className="font-bold text-slate-900">C-402</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Assigned Bus</span>
                  <span className="font-bold text-slate-900">NC NB-4521</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Route</span>
                  <span className="font-bold text-slate-900">Route 81 (Anuradhapura - Polonnaruwa)</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Shift Status</span>
                  <span className="font-bold text-emerald-600">Active Shift (06:00 - 14:00)</span>
                </div>
              </div>

              <button
                onClick={() => setShowProfileModal(false)}
                className="w-full py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Modal: View Official TapRide Sample Passenger QR */}
        {showSampleQRModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3.5 text-center">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Passenger Boarding QR</h3>
                </div>
                <button
                  onClick={() => setShowSampleQRModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex flex-col items-center">
                <img
                  src="/passenger-qr.png"
                  alt="Standard Passenger QR"
                  className="w-44 h-44 bg-white p-2 rounded-xl shadow-xs border border-slate-200 object-contain"
                />
                <div className="text-xs font-bold text-slate-800 mt-2">Passenger TR-2048</div>
                <div className="text-[10px] text-slate-500 font-mono">Payload: TR-2048|BUS-NC4521|FARE-NCP</div>
              </div>

              <div className="bg-blue-50 p-3 rounded-xl text-[11px] text-blue-900 leading-relaxed text-left space-y-1">
                <div className="font-bold flex items-center gap-1 text-blue-950">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  How to test camera scanning:
                </div>
                <div>1. Open <a href="/passenger-qr.png" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700">/passenger-qr.png</a> on your phone screen.</div>
                <div>2. Point the phone towards the laptop webcam to verify live scanning.</div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowSampleQRModal(false)
                    handleProcessScan('TR-2048|BUS-NC4521|FARE-NCP')
                  }}
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
                >
                  Validate This QR
                </button>
                <button
                  type="button"
                  onClick={() => setShowSampleQRModal(false)}
                  className="py-2 px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>
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
            onClick={() => setShowHistoryModal(true)}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium">History</span>
          </button>

          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
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
