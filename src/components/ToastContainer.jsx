import { useState } from 'react'

// Module-level toast store so it can be called from anywhere
let _setter = null
export function addToast(message, type = 'success') {
  if (_setter) _setter(prev => [...prev, { id: Date.now() + Math.random(), message, type }])
}

const ICONS  = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle', warn: 'fa-exclamation-circle' }
const COLORS = { success: 'bg-green-500', error: 'bg-red-500', info: 'bg-blue-500', warn: 'bg-amber-500' }

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])
  _setter = setToasts

  function dismiss(id) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  // Auto-dismiss after 3s
  function onMount(id) {
    setTimeout(() => dismiss(id), 3000)
  }

  return (
    <div style={{ position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)', zIndex:9999, display:'flex', flexDirection:'column', gap:8, alignItems:'center', pointerEvents:'none' }}>
      {toasts.map(t => (
        <div
          key={t.id}
          ref={() => onMount(t.id)}
          onClick={() => dismiss(t.id)}
          className={`${COLORS[t.type] || 'bg-gray-800'} text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 cursor-pointer text-sm font-medium`}
          style={{ minWidth: 240, pointerEvents:'auto', animation:'toastIn 0.3s forwards' }}
        >
          <i className={`fas ${ICONS[t.type] || 'fa-bell'}`} />
          {t.message}
        </div>
      ))}
    </div>
  )
}
