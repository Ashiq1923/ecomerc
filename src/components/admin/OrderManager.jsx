import { useState, useEffect } from 'react'
import { supabase, formatPrice } from '../../lib/supabase'
import { addToast } from '../ToastContainer'

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped:   'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}
const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function OrderManager() {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [filter,  setFilter]  = useState('all')

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
    addToast(`Order status updated to ${status}`, 'success')
  }

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold text-gray-800">Orders ({orders.length})</h2>
        <div className="flex gap-2 flex-wrap">
          {['all', ...STATUSES].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition border
                ${filter === s ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
        {STATUSES.map(s => (
          <div key={s} className={`p-3 rounded-xl text-center ${STATUS_COLORS[s]}`}>
            <p className="text-xl font-bold">{orders.filter(o => o.status === s).length}</p>
            <p className="text-xs capitalize font-medium">{s}</p>
          </div>
        ))}
      </div>

      {loading ? <div className="skeleton h-64 rounded-xl" /> : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="fas fa-box-open text-4xl mb-3 block opacity-30" />
          <p>No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => (
            <div key={order.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              {/* Header row */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0,8)}</span>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{order.customer_name}</p>
                    <p className="text-xs text-gray-500">{order.customer_phone}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-bold text-gray-800">{formatPrice(order.total_amount)}</span>
                  <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-PK')}</span>
                  <i className={`fas fa-chevron-${expanded === order.id ? 'up' : 'down'} text-xs text-gray-400`} />
                </div>
              </div>

              {/* Expanded detail */}
              {expanded === order.id && (
                <div className="border-t bg-gray-50 p-4 space-y-4">
                  {/* Items */}
                  {order.items?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Items</p>
                      <div className="space-y-1">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm text-gray-700 bg-white rounded-lg px-3 py-2">
                            <span>{item.name} <span className="text-gray-400">× {item.quantity}</span></span>
                            <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {order.customer_address && (
                    <p className="text-sm text-gray-600"><strong>Address:</strong> {order.customer_address}</p>
                  )}
                  {order.notes && (
                    <p className="text-sm text-gray-600"><strong>Notes:</strong> {order.notes}</p>
                  )}

                  {/* Status update */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500">Update Status:</span>
                    {STATUSES.map(s => (
                      <button key={s} onClick={() => updateStatus(order.id, s)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition border
                          ${order.status === s
                            ? `${STATUS_COLORS[s]} border-transparent`
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary'}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
