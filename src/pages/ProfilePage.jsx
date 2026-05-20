import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, formatPrice } from '../lib/supabase'

const TABS = [
  { key: 'profile',  label: 'My Profile',       icon: 'fa-user' },
  { key: 'password', label: 'Change Password',   icon: 'fa-lock' },
  { key: 'orders',   label: 'My Orders',         icon: 'fa-box' },
]

const STATUS_STYLES = {
  pending:   { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'fa-clock' },
  confirmed: { bg: 'bg-blue-100',   text: 'text-blue-700',   icon: 'fa-check-circle' },
  shipped:   { bg: 'bg-purple-100', text: 'text-purple-700', icon: 'fa-truck' },
  delivered: { bg: 'bg-green-100',  text: 'text-green-700',  icon: 'fa-check-double' },
  cancelled: { bg: 'bg-red-100',    text: 'text-red-700',    icon: 'fa-times-circle' },
}

export default function ProfilePage() {
  const { user, profile, loading: authLoading, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [tab, setTab] = useState(() => {
    const t = searchParams.get('tab')
    return TABS.some(x => x.key === t) ? t : 'profile'
  })

  useEffect(() => {
    if (!authLoading && !user) navigate('/')
  }, [authLoading, user, navigate])

  if (authLoading) return <PageLoader />
  if (!user) return null

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
          <i className="fas fa-user-circle text-emerald-500" />
          My Account
        </h1>
        <p className="text-sm text-gray-400 mt-1">{user.email}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">

        {/* Sidebar nav */}
        <aside className="sm:w-52 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-150 border-l-2 ${
                  tab === t.key
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <i className={`fas ${t.icon} w-4 text-center ${tab === t.key ? 'text-emerald-500' : 'text-gray-400'}`} />
                {t.label}
              </button>
            ))}
            <div className="border-t border-gray-100 p-3">
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                <i className="fas fa-arrow-left text-xs" />
                Back to Store
              </Link>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {tab === 'profile'  && <ProfileTab user={user} profile={profile} updateProfile={updateProfile} />}
          {tab === 'password' && <PasswordTab />}
          {tab === 'orders'   && <OrdersTab user={user} />}
        </div>
      </div>
    </div>
  )
}

/* ── Profile / Delivery Details Tab ─────────────────────────────── */
function ProfileTab({ user, profile, updateProfile }) {
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone:     profile?.phone     || '',
    address:   profile?.address   || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState(null)

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || '',
      phone:     profile?.phone     || '',
      address:   profile?.address   || '',
    })
  }, [profile])

  function change(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setSaved(false)
    setError(null)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await updateProfile({
        full_name: form.full_name.trim(),
        phone:     form.phone.trim(),
        address:   form.address.trim(),
      })
      setSaved(true)
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.')
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-user text-emerald-500" />
          Profile &amp; Delivery Details
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Saved details auto-fill the checkout form so you don&apos;t have to type them again.
        </p>
      </div>

      <form onSubmit={handleSave} className="p-5 space-y-4">
        <ProfileField label="Full Name" name="full_name" type="text"     value={form.full_name} onChange={change} placeholder="Ahmad Ali" />
        <ProfileField label="Phone"     name="phone"     type="tel"      value={form.phone}     onChange={change} placeholder="03XX-XXXXXXX" />
        <ProfileField label="Delivery Address" name="address" type="text" value={form.address}  onChange={change} placeholder="House #, Street, City" />

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-200">
            <i className="fas fa-exclamation-circle" />
            {error}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {saving
              ? <><i className="fas fa-spinner fa-spin" /> Saving...</>
              : saved
                ? <><i className="fas fa-check" /> Saved!</>
                : <><i className="fas fa-save" /> Save Changes</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── Change Password Tab ─────────────────────────────────────────── */
function PasswordTab() {
  const [form, setForm]   = useState({ newPass: '', confirmPass: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg]     = useState(null)

  function change(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setMsg(null)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (form.newPass.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    if (form.newPass !== form.confirmPass) {
      setMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: form.newPass })
    setSaving(false)
    if (error) {
      setMsg({ type: 'error', text: error.message })
    } else {
      setMsg({ type: 'success', text: 'Password updated successfully!' })
      setForm({ newPass: '', confirmPass: '' })
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
        <h2 className="font-bold text-gray-800 flex items-center gap-2">
          <i className="fas fa-lock text-emerald-500" />
          Change Password
        </h2>
      </div>

      <form onSubmit={handleSave} className="p-5 space-y-4">
        <ProfileField label="New Password"     name="newPass"     type="password" value={form.newPass}     onChange={change} placeholder="Min. 6 characters" />
        <ProfileField label="Confirm Password" name="confirmPass" type="password" value={form.confirmPass} onChange={change} placeholder="Repeat new password" />

        {msg && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
            msg.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-600 border border-red-200'
          }`}>
            <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`} />
            {msg.text}
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 disabled:opacity-60"
          >
            {saving
              ? <><i className="fas fa-spinner fa-spin" /> Updating...</>
              : <><i className="fas fa-key" /> Update Password</>
            }
          </button>
        </div>
      </form>
    </div>
  )
}

/* ── My Orders Tab ───────────────────────────────────────────────── */
function OrdersTab({ user }) {
  const [orders,  setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data || [])
        setLoading(false)
      })
  }, [user.id])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      </div>
    )
  }

  if (!orders.length) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-12 text-center">
        <i className="fas fa-box-open text-5xl text-gray-200 mb-4 block" />
        <p className="text-lg font-semibold text-gray-500 mb-1">No orders yet</p>
        <p className="text-sm text-gray-400 mb-5">Your order history will appear here once you place an order.</p>
        <Link
          to="/"
          className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          <i className="fas fa-shopping-bag" />
          Start Shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <i className="fas fa-box text-emerald-500" />
            My Orders
            <span className="ml-auto text-sm font-normal text-gray-400">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
          </h2>
        </div>

        <div className="divide-y divide-gray-50">
          {orders.map(order => {
            const style   = STATUS_STYLES[order.status] || STATUS_STYLES.pending
            const isOpen  = expanded === order.id
            const items   = Array.isArray(order.items) ? order.items : []
            const date    = new Date(order.created_at).toLocaleDateString('en-PK', {
              day: 'numeric', month: 'short', year: 'numeric'
            })

            return (
              <div key={order.id}>
                {/* Order row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors duration-150 text-left"
                >
                  {/* Status icon */}
                  <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center flex-shrink-0`}>
                    <i className={`fas ${style.icon} ${style.text} text-sm`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-gray-800">
                        {items.length} item{items.length !== 1 ? 's' : ''}
                      </span>
                      <span className={`text-xs capitalize px-2.5 py-0.5 rounded-full font-semibold ${style.bg} ${style.text}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                  </div>

                  {/* Total */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800">{formatPrice(order.total_amount)}</p>
                    <i className={`fas fa-chevron-down text-xs text-gray-400 mt-1 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* Expanded order details */}
                {isOpen && (
                  <div className="px-4 pb-4 bg-gray-50 border-t border-gray-100">
                    <div className="pt-3 space-y-2">
                      {/* Delivery info */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-600 mb-3">
                        <span className="flex items-center gap-1.5">
                          <i className="fas fa-user text-gray-400" />
                          {order.customer_name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <i className="fas fa-phone text-gray-400" />
                          {order.customer_phone}
                        </span>
                        {order.customer_address && (
                          <span className="flex items-center gap-1.5">
                            <i className="fas fa-map-marker-alt text-gray-400" />
                            {order.customer_address}
                          </span>
                        )}
                      </div>

                      {/* Items list */}
                      {items.map((item, i) => (
                        <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold flex-shrink-0">
                              {item.quantity}
                            </span>
                            <span className="text-sm text-gray-700 truncate">{item.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-800 flex-shrink-0 ml-2">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}

                      {/* Order total */}
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-sm font-semibold text-gray-600">Total</span>
                        <span className="text-base font-extrabold text-gray-800">{formatPrice(order.total_amount)}</span>
                      </div>

                      {/* Notes */}
                      {order.notes && (
                        <p className="text-xs text-gray-400 italic mt-1">
                          <i className="fas fa-sticky-note mr-1" />
                          {order.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/* ── Shared form field ───────────────────────────────────────────── */
function ProfileField({ label, name, type, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-all duration-150 bg-white"
      />
    </div>
  )
}

/* ── Full-screen loader ──────────────────────────────────────────── */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"    style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
