import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef    = useRef(null)
  const streamRef   = useRef(null)   // raw MediaStream
  const controlsRef = useRef(null)   // ZXing controls
  const [error,   setError]   = useState(null)
  const [devices, setDevices] = useState([])
  const [selDev,  setSelDev]  = useState(undefined) // undefined = enumerating
  const [scanned, setScanned] = useState(null)

  // Step 1 — enumerate cameras once on mount
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

  // Step 2 — start camera whenever selected device changes
  useEffect(() => {
    if (selDev === undefined) return
    startCamera(selDev)
    return () => cleanup()
  }, [selDev])

  async function startCamera(deviceId) {
    cleanup()
    setError(null)
    try {
      // 1. Get stream with getUserMedia — most reliable way
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: 'environment' },
      })
      streamRef.current = stream

      // 2. Attach stream to video element and play explicitly
      const video = videoRef.current
      if (!video) { cleanup(); return }
      video.srcObject = stream
      await video.play()

      // 3. Hand the already-playing stream to ZXing for barcode decoding
      const reader   = new BrowserMultiFormatReader()
      const controls = await reader.decodeFromStream(stream, video, (result) => {
        if (!result) return
        const text = result.getText()
        if (/^ORD-[A-Z0-9]{6}$/i.test(text)) {
          setScanned(text.toUpperCase())
          cleanup()
          onScan(text.toUpperCase())
        }
      })
      controlsRef.current = controls
    } catch (e) {
      setError(e.message || 'Could not access camera')
    }
  }

  function cleanup() {
    if (controlsRef.current) {
      try { controlsRef.current.stop() } catch {}
      controlsRef.current = null
    }
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

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
          <span className="text-sm font-semibold flex items-center gap-2">
            <i className="fas fa-barcode text-emerald-400" /> Scan Order Barcode
          </span>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-lg transition">
            <i className="fas fa-times text-gray-300 text-xs" />
          </button>
        </div>

        {/* Camera selector — only if multiple cameras */}
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

        {/* Video feed */}
        <div className="relative mx-4 my-3 rounded-xl overflow-hidden bg-black" style={{ aspectRatio: '16/9' }}>
          <video
            ref={videoRef}
            className="w-full h-full"
            style={{ objectFit: 'cover', display: 'block' }}
            muted
            playsInline
          />

          {/* Scanning guide */}
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

          {/* Success overlay */}
          {scanned && (
            <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center gap-2">
              <i className="fas fa-check-circle text-white text-4xl" />
              <p className="text-white font-bold text-lg">{scanned}</p>
              <p className="text-emerald-100 text-sm">Order detected!</p>
            </div>
          )}

          {/* Error overlay */}
          {error && (
            <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center gap-2 p-4 text-center">
              <i className="fas fa-video-slash text-red-400 text-3xl" />
              <p className="text-white text-sm font-medium">{error}</p>
              <p className="text-gray-400 text-xs">Allow camera access in browser settings</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 text-center">
          {!scanned && !error && (
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
              <i className="fas fa-barcode text-gray-300" />
              Order slip ka barcode camera ke saamne rakho
            </p>
          )}
          {scanned && (
            <button
              onClick={rescan}
              className="mt-1 w-full py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
            >
              <i className="fas fa-redo mr-1" /> Dobara Scan Karo
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
