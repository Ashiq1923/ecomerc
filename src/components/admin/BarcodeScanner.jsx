import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef   = useRef(null)
  const streamRef  = useRef(null)
  const rafRef     = useRef(null)   // requestAnimationFrame id
  const readerRef  = useRef(new BrowserMultiFormatReader())
  const canvasRef  = useRef(document.createElement('canvas'))

  const [error,   setError]   = useState(null)
  const [devices, setDevices] = useState([])
  const [selDev,  setSelDev]  = useState(undefined)
  const [scanned, setScanned] = useState(null)

  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices()
      .then(all => {
        const cams = all.filter(d => d.kind === 'videoinput')
        setDevices(cams)
        if (!cams.length) { setError('No camera found on this device'); return }
        const back = cams.find(d => /back|rear|environment/i.test(d.label))
        setSelDev((back || cams[0]).deviceId)
      })
      .catch(() => setError('Camera not accessible'))

    return () => cleanup()
  }, [])

  useEffect(() => {
    if (selDev === undefined) return
    startCamera(selDev)
    return () => cleanup()
  }, [selDev])

  async function startCamera(deviceId) {
    cleanup()
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment' },
      })
      streamRef.current = stream

      const video = videoRef.current
      if (!video) { cleanup(); return }
      video.srcObject = stream
      await video.play()

      // Start frame-by-frame decoding loop once video is actually playing
      video.addEventListener('playing', startScanLoop, { once: true })
    } catch (e) {
      setError(e.message || 'Could not access camera')
    }
  }

  function startScanLoop() {
    const video  = videoRef.current
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')
    const reader = readerRef.current

    async function tick() {
      if (!video || video.readyState < 2 || video.paused) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      canvas.width  = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      try {
        const result = reader.decodeFromCanvas(canvas)
        if (result) {
          const text = result.getText()
          if (/^ORD-[A-Z0-9]{6}$/i.test(text)) {
            setScanned(text.toUpperCase())
            cleanup()
            onScan(text.toUpperCase())
            return // stop loop
          }
        }
      } catch {
        // NotFoundException fires on every empty frame — ignore
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  function cleanup() {
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
  }

  function rescan() {
    setScanned(null)
    startCamera(selDev)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm modal-enter overflow-hidden">

        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
          <span className="text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-barcode text-emerald-400" /> Scan Order Barcode
          </span>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-lg transition">
            <i className="fas fa-times text-gray-300 text-xs" />
          </button>
        </div>

        {devices.length > 1 && (
          <div className="px-4 pt-3">
            <select
              value={selDev || ''}
              onChange={e => setSelDev(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {devices.map(d => (
                <option key={d.deviceId} value={d.deviceId}>{d.label || d.deviceId}</option>
              ))}
            </select>
          </div>
        )}

        <div className="relative mx-4 my-3 rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            className="w-full h-full"
            style={{ objectFit: 'cover', display: 'block' }}
            muted
            playsInline
          />

          {!scanned && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-emerald-400 rounded-lg w-3/4 h-16 relative">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-emerald-400 opacity-60 animate-pulse" />
                {['top-0 left-0','top-0 right-0','bottom-0 left-0','bottom-0 right-0'].map((pos, i) => (
                  <div key={i} className={`absolute ${pos} w-3 h-3 border-emerald-400 border-2 ${
                    i < 2 ? 'border-b-0' : 'border-t-0'
                  } ${i % 2 === 0 ? 'border-r-0' : 'border-l-0'}`} />
                ))}
              </div>
            </div>
          )}

          {scanned && (
            <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center gap-2">
              <i className="fas fa-check-circle text-white text-4xl" />
              <p className="text-white font-bold text-lg">{scanned}</p>
              <p className="text-emerald-100 text-sm">Order detected!</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <i className="fas fa-video-slash text-red-400 text-3xl" />
              <p className="text-white text-sm font-medium">{error}</p>
              <p className="text-gray-400 text-xs">Allow camera access in browser settings</p>
            </div>
          )}
        </div>

        <div className="px-4 pb-4 text-center">
          {!scanned && !error && (
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <i className="fas fa-barcode text-gray-300" />
              Order slip ka barcode camera ke saamne rakho
            </p>
          )}
          {scanned && (
            <button onClick={rescan} className="mt-1 w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition">
              <i className="fas fa-redo mr-1" /> Dobara Scan Karo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
