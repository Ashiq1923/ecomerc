import { useState, useEffect } from 'react'
import { supabase, formatPrice } from '../../lib/supabase'
import { addToast } from '../ToastContainer'
import PrintSlip, { orderNo } from '../PrintSlip'
import BarcodeScanner from './BarcodeScanner'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  shipped:   'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}
const STATUS_ICONS = {
  pending:   'fa-clock',
  confirmed: 'fa-check-circle',
  shipped:   'fa-truck',
  delivered: 'fa-check-double',
  cancelled: 'fa-times-circle',
}
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function OrderManager() {
  const [orders,   setOrders]   = useState([])
  const [loading,  setLoading]  = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter,   setFilter]   = useState('all')
  const [printing,  setPrinting]  = useState(null)
  const [search,    setSearch]    = useState('')
  const [scanning,  setScanning]  = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    setOrders(data || [])
    setLoading(false)
  }

  async function updateStatus(orderId, status) {
    await supabase.from('orders').update({ status }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    addToast(`Status updated to ${status}`, 'success')
  }

  async function handleScan(scannedNo) {
    setScanning(false)
    // Find order whose orderNo matches the scanned barcode
    const matched = orders.find(o => orderNo(o.id) === scannedNo)
    if (!matched) {
      addToast(`No order found for ${scannedNo}`, 'error')
      return
    }
    if (matched.status === 'confirmed') {
      addToast(`Order ${scannedNo} is already confirmed`, 'info')
      return
    }
    if (matched.status === 'cancelled') {
      addToast(`Order ${scannedNo} is cancelled — cannot confirm`, 'error')
      return
    }
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', matched.id)
    setOrders(prev => prev.map(o => o.id === matched.id ? { ...o, status: 'confirmed' } : o))
    addToast(`✅ Order ${scannedNo} confirmed for ${matched.customer_name}!`, 'success')
    // Auto-expand the confirmed order so admin sees it
    setExpanded(matched.id)
    setFilter('all')
  }

  const count  = s => orders.filter(o => o.status === s).length

  const byStatus = filter === 'all' ? orders : orders.filter(o => o.status === filter)
  const filtered = search.trim()
    ? byStatus.filter(o => {
        const q = search.trim().toLowerCase()
        return (
          orderNo(o.id).toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.customer_phone?.toLowerCase().includes(q)
        )
      })
    : byStatus

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-800">Orders ({orders.length})</h2>
        <div className="flex items-center gap-2 flex-1 min-w-0 max-w-sm">
          <div className="relative flex-1">
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order #, name or phone..."
              className="w-full pl-8 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className="fas fa-times text-xs" />
              </button>
            )}
          </div>
          <button
            onClick={() => setScanning(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition flex-shrink-0"
          >
            <i className="fas fa-barcode" /> Scan & Confirm
          </button>
          <button onClick={load} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition flex-shrink-0">
            <i className="fas fa-rotate-right" /> Refresh
          </button>
        </div>
      </div>

      {/* Status tabs with counts */}
      <div className="flex gap-2 flex-wrap mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition border ${
            filter === 'all'
              ? 'bg-gray-800 text-white border-gray-800'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          All <span className="ml-1 opacity-70">{orders.length}</span>
        </button>
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition border ${
              filter === s
                ? STATUS_COLORS[s]
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            <i className={`fas ${STATUS_ICONS[s]} mr-1`} />
            {s} <span className="ml-1 opacity-70">{count(s)}</span>
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-5">
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`p-3 rounded-xl text-center border transition hover:scale-105 ${STATUS_COLORS[s]} ${filter === s ? 'ring-2 ring-offset-1 ring-current' : ''}`}
          >
            <i className={`fas ${STATUS_ICONS[s]} text-sm mb-1 block`} />
            <p className="text-xl font-bold">{count(s)}</p>
            <p className="text-xs capitalize font-medium">{s}</p>
          </button>
        ))}
      </div>

      {loading ? <div className="skeleton h-64 rounded-xl" /> : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-box-open text-4xl mb-3 block opacity-30" />
          <p>{search ? `No orders found for "${search}"` : `No ${filter === 'all' ? '' : filter} orders`}</p>
          {search && <button onClick={() => setSearch('')} className="mt-2 text-sm text-primary hover:underline">Clear search</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden animate-fade-in-up">
              {/* Header row */}
              <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition cursor-pointer"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono font-bold">#{orderNo(order.id)}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_phone}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize border ${STATUS_COLORS[order.status]}`}>
                    <i className={`fas ${STATUS_ICONS[order.status]} mr-1`} />{order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-gray-800">{formatPrice(order.total_amount)}</span>
                  <span className="text-xs text-gray-400 hidden sm:block">
                    {new Date(order.created_at).toLocaleDateString('en-PK')}
                  </span>
                  <i className={`fas fa-chevron-${expanded === order.id ? 'up' : 'down'} text-xs text-gray-400`} />
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className="border-t bg-gray-50 p-4 space-y-4 animate-fade-in">
                  {/* Items */}
                  {order.items?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Items</p>
                      <div className="space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm text-gray-700 bg-white rounded-lg px-3 py-2 border border-gray-100">
                            <span>{item.name} <span className="text-gray-400">× {item.quantity}</span></span>
                            <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between text-sm font-bold text-gray-800 px-3 pt-1">
                          <span>Total</span>
                          <span>{formatPrice(order.total_amount)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Delivery info */}
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {order.customer_address && (
                      <div className="bg-white rounded-xl p-3 border border-gray-100">
                        <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Address</p>
                        <p className="text-gray-700">{order.customer_address}</p>
                      </div>
                    )}
                    {order.location && (
                      <div className="bg-white rounded-xl p-3 border border-blue-100">
                        <p className="text-xs text-blue-400 font-semibold uppercase mb-1 flex items-center gap-1">
                          <i className="fas fa-location-dot" /> Live Location
                        </p>
                        <a
                          href={`https://maps.google.com/?q=${order.location}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline text-xs font-medium flex items-center gap-1"
                        >
                          <i className="fas fa-map-marker-alt" /> Open in Google Maps
                        </a>
                        <p className="text-xs text-gray-400 font-mono mt-1">{order.location}</p>
                      </div>
                    )}
                  </div>

                  {order.notes && (
                    <p className="text-sm text-gray-600 bg-white rounded-xl px-3 py-2 border border-gray-100">
                      <i className="fas fa-sticky-note text-gray-400 mr-1" />
                      <strong>Notes:</strong> {order.notes}
                    </p>
                  )}

                  {/* Status update + print */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-gray-500">Update Status:</span>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => updateStatus(order.id, s)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition border ${
                          order.status === s
                            ? STATUS_COLORS[s]
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                    <button
                      onClick={e => { e.stopPropagation(); setPrinting(order) }}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white rounded-full text-xs font-semibold hover:bg-gray-700 transition"
                    >
                      <i className="fas fa-print" /> Print Slip
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {printing  && <PrintSlip     order={printing} onClose={() => setPrinting(null)} />}
      {scanning  && <BarcodeScanner onScan={handleScan} onClose={() => setScanning(false)} />}
    </div>
  )
}
