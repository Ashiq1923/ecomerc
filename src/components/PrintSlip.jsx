import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { QRCodeSVG } from 'qrcode.react'
import Barcode from 'react-barcode'
import { formatPrice } from '../lib/supabase'

export function orderNo(id) {
  return `ORD-${id.slice(0, 6).toUpperCase()}`
}

export default function PrintSlip({ order, onClose }) {
  const items  = Array.isArray(order.items) ? order.items : []
  const date   = new Date(order.created_at).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const mapUrl = order.location ? `https://maps.google.com/?q=${order.location}` : null
  const no     = orderNo(order.id)

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* ── Screen modal (hidden during print via CSS) ── */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm modal-enter overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white">
            <span className="text-sm font-semibold flex items-center gap-2">
              <i className="fas fa-print text-emerald-400" /> Order Slip Preview
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-xs font-bold transition"
              >
                <i className="fas fa-print" /> Print
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-700 rounded-lg transition">
                <i className="fas fa-times text-gray-300 text-xs" />
              </button>
            </div>
          </div>

          {/* Preview — scaled-down landscape slip */}
          <div className="p-4 overflow-y-auto max-h-[75vh] bg-gray-100 flex items-center justify-center">
            <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', width: '7in', marginBottom: '-200px' }}>
              <LandscapeSlip order={order} items={items} date={date} mapUrl={mapUrl} no={no} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Print portal — rendered outside #root, shown only when printing ── */}
      {createPortal(
        <div className="print-portal">
          <LandscapeSlip order={order} items={items} date={date} mapUrl={mapUrl} no={no} />
        </div>,
        document.body
      )}
    </>
  )
}

/* ── 7×4 Landscape Parcel Label ──────────────────────────────────── */
function LandscapeSlip({ order, items, date, mapUrl, no }) {
  return (
    <div style={{
      width: '7in', height: '4in', display: 'flex', flexDirection: 'column',
      border: '2px solid #222', fontFamily: 'Arial, sans-serif', background: '#fff',
      boxSizing: 'border-box', overflow: 'hidden',
    }}>
      {/* Top bar */}
      <div style={{
        background: '#111', color: '#fff', display: 'flex',
        alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 14px', flexShrink: 0,
      }}>
        <span style={{ fontSize: 18, fontWeight: 'bold', letterSpacing: 3 }}>SHOPEASE</span>
        <span style={{ fontSize: 11, opacity: 0.7 }}>Delivery Order Slip</span>
        <span style={{ fontSize: 13, fontWeight: 'bold', fontFamily: 'monospace' }}>#{no}</span>
      </div>

      {/* Body — two columns */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT — customer info */}
        <div style={{ flex: 1, padding: '10px 14px', borderRight: '1px dashed #aaa', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div>
            <p style={{ fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 3px' }}>Deliver To</p>
            <p style={{ fontSize: 16, fontWeight: 'bold', margin: 0 }}>{order.customer_name}</p>
            <p style={{ fontSize: 12, color: '#333', margin: '2px 0' }}>{order.customer_phone}</p>
          </div>

          {order.customer_address && (
            <div style={{ background: '#f5f5f5', borderRadius: 5, padding: '6px 8px' }}>
              <p style={{ fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 3px' }}>Address</p>
              <p style={{ fontSize: 11, color: '#333', margin: 0, lineHeight: 1.5 }}>{order.customer_address}</p>
            </div>
          )}

          <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 9, color: '#999' }}>{date}</span>
            {order.notes && (
              <span style={{ fontSize: 9, color: '#666', fontStyle: 'italic', maxWidth: '60%', textAlign: 'right' }}>
                Note: {order.notes}
              </span>
            )}
          </div>
        </div>

        {/* RIGHT — items + total + QR */}
        <div style={{ width: '2.6in', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <p style={{ fontSize: 8, color: '#888', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Order Items</p>

          <div style={{ flex: 1, overflowY: 'hidden' }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', marginRight: 6 }}>
                  {item.name} <span style={{ color: '#888' }}>×{item.quantity}</span>
                </span>
                <span style={{ fontWeight: 'bold', flexShrink: 0 }}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: 14, borderTop: '2px solid #222', paddingTop: 5, marginTop: 4 }}>
            <span>TOTAL</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>

          {/* QR code */}
          {mapUrl && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, paddingTop: 6, borderTop: '1px dashed #ccc' }}>
              <QRCodeSVG value={mapUrl} size={56} level="M" />
              <div>
                <p style={{ fontSize: 8, fontWeight: 'bold', margin: '0 0 2px', color: '#333' }}>Location</p>
                <p style={{ fontSize: 8, color: '#888', margin: 0 }}>Scan to open</p>
                <p style={{ fontSize: 8, color: '#888', margin: 0 }}>in Google Maps</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom bar — barcode for admin scanning */}
      <div style={{
        background: '#fff', borderTop: '2px dashed #ccc',
        padding: '6px 14px', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 8, color: '#aaa', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Scan to Confirm Order</p>
          <Barcode
            value={no}
            width={1.4}
            height={36}
            fontSize={10}
            margin={0}
            background="#fff"
            lineColor="#111"
            displayValue={true}
          />
        </div>
        <span style={{ fontSize: 9, color: '#bbb', textAlign: 'right' }}>Thank you for shopping<br />with ShopEase!</span>
      </div>
    </div>
  )
}

