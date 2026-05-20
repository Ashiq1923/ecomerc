import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { addToast } from './ToastContainer'

export default function AuthModal() {
  const { authModal, setAuthModal, login, register } = useAuth()
  const [tab, setTab]         = useState('login')
  const [loading, setLoading] = useState(false)
  const [form, setForm]       = useState({ email: '', password: '', fullName: '', phone: '', confirm: '' })
  const [error, setError]     = useState('')

  if (!authModal) return null

  function change(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Please fill all fields'); return }
    setLoading(true)
    try {
      await login(form.email, form.password)
      addToast('Welcome back!', 'success')
      setAuthModal(false)
      setForm({ email: '', password: '', fullName: '', phone: '', confirm: '' })
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!form.email || !form.password || !form.fullName) { setError('Please fill all required fields'); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form.email, form.password, form.fullName, form.phone)
      addToast('Account created! Please check your email to verify.', 'success')
      setAuthModal(false)
      setForm({ email: '', password: '', fullName: '', phone: '', confirm: '' })
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setAuthModal(false)}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in overflow-hidden">

        {/* Dark header */}
        <div className="bg-gray-900 p-6 text-white relative">
          <button
            onClick={() => setAuthModal(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-150"
            aria-label="Close"
          >
            <i className="fas fa-times text-lg" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <i className="fas fa-store text-emerald-400 text-2xl" />
            <span className="text-white font-bold text-lg">ShopEase</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            {tab === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {tab === 'login' ? 'Sign in to continue shopping' : 'Join us for a better experience'}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100">
          {[
            { key: 'login',    label: 'Sign In' },
            { key: 'register', label: 'Register' },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setError('') }}
              className={`flex-1 py-3 text-sm font-semibold transition-all duration-150 border-b-2
                ${tab === t.key
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="p-6">

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-center gap-2">
              <i className="fas fa-exclamation-circle flex-shrink-0" />
              {error}
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Field
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                placeholder="you@example.com"
                hasError={!!error}
              />
              <Field
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={change}
                placeholder="Enter your password"
                hasError={!!error}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 btn-primary rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin" /> Signing in...</>
                  : <><i className="fas fa-sign-in-alt" /> Sign In</>
                }
              </button>
              <p className="text-center text-xs text-gray-400">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError('') }}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Register
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <Field
                label="Full Name"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={change}
                placeholder="Ahmad Ali"
                required
              />
              <Field
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={change}
                placeholder="you@example.com"
                required
              />
              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={change}
                placeholder="03XX-XXXXXXX"
              />
              <Field
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={change}
                placeholder="Min. 6 characters"
                required
              />
              <Field
                label="Confirm Password"
                name="confirm"
                type="password"
                value={form.confirm}
                onChange={change}
                placeholder="Repeat your password"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 btn-primary rounded-xl font-semibold disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
              >
                {loading
                  ? <><i className="fas fa-spinner fa-spin" /> Creating account...</>
                  : <><i className="fas fa-user-plus" /> Create Account</>
                }
              </button>
              <p className="text-center text-xs text-gray-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError('') }}
                  className="text-emerald-600 font-semibold hover:underline"
                >
                  Sign In
                </button>
              </p>
            </form>
          )}

          {/* Admin note */}
          <p className="text-center text-xs text-gray-400 mt-5 pt-4 border-t border-gray-100">
            <i className="fas fa-shield-alt mr-1.5 text-emerald-500" />
            Admin access requires an admin-level account. You can browse and shop without logging in.
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, name, type, value, onChange, placeholder, hasError, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`px-3.5 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-all duration-150
          ${hasError
            ? 'border-red-300 focus:ring-red-200 focus:border-red-400'
            : 'border-gray-200 focus:ring-emerald-200 focus:border-emerald-400'
          }`}
      />
    </div>
  )
}
