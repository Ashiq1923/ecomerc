import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { supabase, STORE_NAME } from '../lib/supabase'

export default function Navbar() {
  const { user, profile, isAdmin, setAuthModal } = useAuth()
  const { totalItems, setIsOpen } = useCart()
  const [dropOpen, setDropOpen] = useState(false)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) navigate(`/?q=${encodeURIComponent(query.trim())}`)
    else navigate('/')
  }

  async function handleLogout() {
    setDropOpen(false)
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const displayName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'User'
  const avatarLetter = (profile?.full_name || user?.email || 'U')[0].toUpperCase()

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <i className="fas fa-store text-emerald-400 text-xl" />
            <span className="text-lg font-extrabold text-white hidden sm:block tracking-tight group-hover:text-emerald-400 transition-colors duration-200">
              {STORE_NAME}
            </span>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
              />
              <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Cart */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded-xl transition-all duration-200"
              aria-label="Open cart"
            >
              <i className="fas fa-shopping-cart text-lg" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm leading-none">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </button>

            {/* Admin pill */}
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-bold transition-all duration-200 shadow-sm"
              >
                <i className="fas fa-tachometer-alt text-xs" />
                Admin
              </Link>
            )}

            {/* User section */}
            {user ? (
              <div className="relative">

                {/* Avatar button */}
                <button
                  onClick={() => setDropOpen(prev => !prev)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-gray-800 transition-all duration-200"
                  type="button"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
                    {avatarLetter}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-300 max-w-[80px] truncate">
                    {displayName}
                  </span>
                  <i className={`fas fa-chevron-down text-xs text-gray-400 transition-transform duration-200 ${dropOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {dropOpen && (
                  <>
                    {/* Invisible overlay to close on outside click */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropOpen(false)}
                    />

                    {/* Dropdown menu */}
                    <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 animate-fade-in">

                      {/* User info header */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {avatarLetter}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 mt-1 text-xs bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold">
                            <i className="fas fa-shield-alt text-xs" />
                            Admin Account
                          </span>
                        )}
                      </div>

                      {/* Admin Panel link */}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setDropOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-emerald-700 hover:bg-emerald-50 font-semibold transition-colors duration-150"
                        >
                          <i className="fas fa-tachometer-alt w-4 text-center" />
                          Admin Panel
                        </Link>
                      )}

                      {/* My Profile */}
                      <Link
                        to="/profile"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <i className="fas fa-user-circle w-4 text-center text-gray-400" />
                        My Profile
                      </Link>

                      {/* My Orders */}
                      <Link
                        to="/profile?tab=orders"
                        onClick={() => setDropOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                      >
                        <i className="fas fa-box w-4 text-center text-gray-400" />
                        My Orders
                      </Link>

                      <div className="border-t border-gray-100 mt-1 pt-1">
                        {/* Logout */}
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors duration-150"
                        >
                          <i className="fas fa-sign-out-alt w-4 text-center" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-sm font-semibold transition-all duration-200 shadow-sm"
              >
                <i className="fas fa-user text-xs" />
                Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
