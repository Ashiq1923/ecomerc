import { useState } from 'react'

export default function LocationPicker({ value, onChange }) {
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  function getLocation() {
    if (!navigator.geolocation) { setError('Browser location not supported'); return }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      pos => {
        onChange(`${pos.coords.latitude},${pos.coords.longitude}`)
        setLoading(false)
      },
      () => {
        setError('Location access denied. Allow location in browser settings.')
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }

  const mapUrl = value ? `https://maps.google.com/?q=${value}` : null

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={getLocation}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-semibold transition disabled:opacity-50"
        >
          {loading
            ? <><i className="fas fa-spinner fa-spin" /> Getting location...</>
            : <><i className="fas fa-crosshairs" /> Use Current Location</>
          }
        </button>

        {value && (
          <>
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-600 hover:underline font-medium"
            >
              <i className="fas fa-map-marker-alt" /> View on Map
            </a>
            <button
              type="button"
              onClick={() => { onChange(''); setError(null) }}
              className="text-xs text-red-400 hover:text-red-600 transition"
            >
              <i className="fas fa-times" /> Remove
            </button>
          </>
        )}
      </div>

      {value && (
        <p className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-1 rounded-lg inline-block">
          <i className="fas fa-location-dot mr-1 text-emerald-400" />
          {value}
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <i className="fas fa-exclamation-circle" /> {error}
        </p>
      )}
    </div>
  )
}
