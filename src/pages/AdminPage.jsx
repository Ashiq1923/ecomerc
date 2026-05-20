import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase, formatPrice } from '../lib/supabase'
import ProductManager  from '../components/admin/ProductManager'
import OrderManager    from '../components/admin/OrderManager'
import BannerManager   from '../components/admin/BannerManager'
import ReviewManager   from '../components/admin/ReviewManager'
import CategoryManager from '../components/admin/CategoryManager'

const TABS = [
  { key: 'dashboard',  label: 'Dashboard',   icon: 'fa-tachometer-alt' },
  { key: 'products',   label: 'Products',    icon: 'fa-box' },
  { key: 'orders',     label: 'Orders',      icon: 'fa-shopping-bag' },
  { key: 'categories', label: 'Categories',  icon: 'fa-tags' },
  { key: 'banners',    label: 'Banners',     icon: 'fa-images' },
  { key: 'reviews',    label: 'Reviews',     icon: 'fa-star' },
]

export default function AdminPage() {
  const { user, profile, isAdmin, loading, profileError } = useAuth()
  const [tab,         setTab]         = useState('dashboard')
  const [stats,       setStats]       = useState(null)
  const [statsError,  setStatsError]  = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Guard: only redirect if profile loaded successfully AND user is not admin.
  // If profile fetch failed (profileError), stay and show the SQL fix screen.
  useEffect(() => {
    if (!loading && !profileError && profile !== null && !isAdmin) {
      window.location.href = '/'
    }
  }, [loading, profileError, profile, isAdmin])

  // Load dashboard stats once we know user is admin
  useEffect(() => {
    if (isAdmin && !loading) {
      loadStats()
    }
  }, [isAdmin, loading])

  async function loadStats() {
    setStatsError(null)
    try {
      const results = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('is_approved', false),
        supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('products').select('name,avg_rating,review_count').order('avg_rating', { ascending: false }).limit(5),
      ])

      // Check if any query returned an RLS/permission error
      const failed = results.find(r => r.error)
      if (failed) {
        console.error('Stats query error:', failed.error)
        setStatsError(failed.error.message || 'Database policy error — run the SQL fix in Supabase.')
        return
      }

      const [
        { count: productCount },
        { count: orderCount },
        { count: reviewCount },
        { data: recentOrders },
        { data: topProducts },
      ] = results

      setStats({ productCount, orderCount, pendingReviews: reviewCount, recentOrders, topProducts })
    } catch (e) {
      console.error('Stats load error:', e)
      setStatsError(e?.message || 'Failed to load stats.')
    }
  }

  // Full-screen loader while auth resolves
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-primary-lg animate-pulse">
            <i className="fas fa-store text-white text-2xl" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-teal-400 animate-bounce"    style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm text-gray-500 font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  // Profile fetch failed (likely RLS policy conflict) — show fix instructions
  if (!loading && profileError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-database text-red-500 text-2xl" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Database Policy Error</h2>
          <p className="text-sm text-gray-500 mb-6">
            Supabase RLS policy conflict is blocking profile access. Run this one SQL line to fix it permanently.
          </p>

          {/* SQL to copy */}
          <div className="bg-gray-900 rounded-xl p-4 text-left mb-6">
            <p className="text-xs text-gray-400 mb-2 font-semibold uppercase tracking-wide">SQL Editor mein paste karo:</p>
            <code className="text-emerald-400 text-sm font-mono select-all">
              drop policy if exists "Admin read all profiles" on profiles;
            </code>
          </div>

          <div className="space-y-3">
            <a
              href="https://supabase.com/dashboard/project/ikklenplcpvkitaziceg/sql/new"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm"
            >
              <i className="fas fa-external-link-alt text-xs" />
              Supabase SQL Editor Kholo
            </a>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
            >
              <i className="fas fa-redo text-xs" />
              SQL run karne ke baad yahan click karo
            </button>
            <Link to="/" className="block text-xs text-gray-400 hover:text-gray-600 transition text-center pt-1">
              Wapas Store par jao
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Do not render if not admin (redirect fires via useEffect)
  if (!isAdmin) return null

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static top-0 left-0 h-full z-40 flex flex-col
        bg-gray-900 text-white w-64 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:shadow-none shadow-2xl
      `}>

        {/* Sidebar header */}
        <div className="p-5 border-b border-gray-700/50 bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md flex-shrink-0">
              <i className="fas fa-store text-white text-sm" />
            </div>
            <div>
              <p className="font-bold text-white text-base leading-tight">ShopEase</p>
              <p className="text-xs text-gray-400 leading-tight">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className="flex-1 p-3 space-y-0.5 sidebar-scroll overflow-y-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSidebarOpen(false) }}
              className={`
                w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                ${tab === t.key
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-primary-sm'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'}
              `}
            >
              <i className={`fas ${t.icon} w-4 text-center`} />
              <span>{t.label}</span>
              {t.key === 'reviews' && stats?.pendingReviews > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none font-bold">
                  {stats.pendingReviews}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {(profile?.full_name || user?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.full_name || 'Admin'}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 py-2 text-xs text-gray-400 hover:text-white transition-colors duration-150 rounded-lg hover:bg-gray-800"
          >
            <i className="fas fa-arrow-left text-xs" />
            Back to Store
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* Top bar */}
        <div className="glass bg-white/90 border-b border-gray-200/60 sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            aria-label="Toggle sidebar"
          >
            <i className="fas fa-bars text-gray-600" />
          </button>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <i className={`fas ${TABS.find(t => t.key === tab)?.icon} text-emerald-600`} />
            <h1 className="text-lg font-bold text-gray-800 capitalize">
              {TABS.find(t => t.key === tab)?.label}
            </h1>
          </div>

          {/* Admin badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
            <i className="fas fa-shield-alt text-xs" />
            Administrator
          </span>
        </div>

        {/* Tab content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 page-enter">
          {tab === 'dashboard'  && <Dashboard stats={stats} statsError={statsError} onTabChange={setTab} onRetry={loadStats} />}
          {tab === 'products'   && <ProductManager />}
          {tab === 'orders'     && <OrderManager />}
          {tab === 'categories' && <CategoryManager />}
          {tab === 'banners'    && <BannerManager />}
          {tab === 'reviews'    && <ReviewManager />}
        </div>
      </div>
    </div>
  )
}

/* Dashboard Component */
function Dashboard({ stats, statsError, onTabChange, onRetry }) {
  if (statsError) {
    return (
      <div className="bg-white rounded-2xl shadow-card border border-red-100 p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-exclamation-triangle text-red-500 text-xl" />
        </div>
        <h3 className="font-bold text-gray-800 mb-2">Database Policy Error</h3>
        <p className="text-sm text-gray-500 mb-1 max-w-md mx-auto">
          Supabase RLS policy conflict detected. You need to run a one-time SQL fix in your Supabase dashboard.
        </p>
        <p className="text-xs text-red-400 font-mono bg-red-50 rounded-lg px-3 py-2 mb-5 mx-auto max-w-md break-all">
          {statsError}
        </p>
        <div className="bg-gray-900 rounded-xl p-4 text-left mb-5 max-w-lg mx-auto">
          <p className="text-xs text-gray-400 mb-2 font-semibold">Run this in Supabase SQL Editor:</p>
          <code className="text-emerald-400 text-xs font-mono whitespace-pre-wrap">
{`drop policy if exists "Admin read all profiles" on profiles;`}
          </code>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href="https://supabase.com/dashboard/project/ikklenplcpvkitaziceg/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold"
          >
            <i className="fas fa-external-link-alt text-xs" />
            Open Supabase SQL Editor
          </a>
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
          >
            <i className="fas fa-redo text-xs" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    )
  }

  const cards = [
    {
      label: 'Total Products',
      value: stats.productCount,
      icon:  'fa-box',
      color: 'from-blue-500 to-blue-600',
      tab:   'products',
    },
    {
      label: 'Total Orders',
      value: stats.orderCount,
      icon:  'fa-shopping-bag',
      color: 'from-emerald-500 to-teal-600',
      tab:   'orders',
    },
    {
      label: 'Pending Reviews',
      value: stats.pendingReviews,
      icon:  'fa-star',
      color: 'from-amber-400 to-amber-500',
      tab:   'reviews',
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(c => (
          <button
            key={c.label}
            onClick={() => onTabChange(c.tab)}
            className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 flex items-center gap-4 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 text-left group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow`}>
              <i className={`fas ${c.icon} text-xl`} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-800">{c.value ?? '—'}</p>
              <p className="text-sm text-gray-500">{c.label}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
              <i className="fas fa-clock text-emerald-600 text-xs" />
            </span>
            Recent Orders
          </h3>

          {!stats.recentOrders?.length ? (
            <div className="text-center py-8">
              <i className="fas fa-inbox text-3xl text-gray-200 mb-2 block" />
              <p className="text-sm text-gray-400">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentOrders.map(o => (
                <div key={o.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{o.customer_name}</p>
                    <p className="text-xs text-gray-400">{o.customer_phone}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-sm font-bold text-gray-800">{formatPrice(o.total_amount)}</p>
                    <span className={`
                      inline-block text-xs capitalize px-2 py-0.5 rounded-full font-medium mt-0.5
                      ${o.status === 'pending'   ? 'bg-yellow-100 text-yellow-700' :
                        o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'}
                    `}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Rated Products */}
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
              <i className="fas fa-trophy text-amber-500 text-xs" />
            </span>
            Top Rated Products
          </h3>

          {!stats.topProducts?.length ? (
            <div className="text-center py-8">
              <i className="fas fa-box-open text-3xl text-gray-200 mb-2 block" />
              <p className="text-sm text-gray-400">No products yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.topProducts.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${i === 0 ? 'bg-amber-400 text-white' :
                        i === 1 ? 'bg-gray-300 text-gray-700' :
                        i === 2 ? 'bg-orange-400 text-white' :
                        'bg-emerald-100 text-emerald-700'}
                    `}>
                      {i + 1}
                    </span>
                    <p className="text-sm font-semibold text-gray-700 truncate max-w-[160px]">
                      {p.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <i className="fas fa-star text-amber-400 text-xs" />
                    <span className="text-sm font-bold text-gray-700">
                      {p.avg_rating ? Number(p.avg_rating).toFixed(1) : '—'}
                    </span>
                    <span className="text-xs text-gray-400">({p.review_count ?? 0})</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
