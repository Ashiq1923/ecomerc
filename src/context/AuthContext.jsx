import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})
const CACHE_KEY = 'se_profile'

function readCache()  {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)) } catch { return null }
}
function writeCache(p) {
  try {
    if (p) localStorage.setItem(CACHE_KEY, JSON.stringify(p))
    else    localStorage.removeItem(CACHE_KEY)
  } catch {}
}

export function AuthProvider({ children }) {
  const cached = readCache()

  const [user,         setUser]         = useState(null)
  const [profile,      setProfile]      = useState(cached)          // instant from cache
  const [loading,      setLoading]      = useState(!cached)         // skip loading if cached
  const [profileError, setProfileError] = useState(false)
  const [authModal,    setAuthModal]    = useState(false)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') return

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setProfileError(false)
        setLoading(false)
        writeCache(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(uid) {
    // If we already have a cached profile for this user, show immediately
    // and fetch fresh data silently in background (no loading flash)
    const alreadyCached = readCache()
    if (alreadyCached?.id === uid) {
      setProfile(alreadyCached)
      setLoading(false)
      // Still refresh in background — don't block UI
      refreshProfileSilent(uid)
      return
    }

    // No cache — show loading and fetch
    setLoading(true)
    setProfileError(false)
    await doFetch(uid)
    setLoading(false)
  }

  async function refreshProfileSilent(uid) {
    const result = await supabase.from('profiles').select('*').eq('id', uid).single()
    if (!result.error && result.data) {
      setProfile(result.data)
      writeCache(result.data)
    }
  }

  async function doFetch(uid) {
    setProfileError(false)
    try {
      let result
      try {
        result = await Promise.race([
          supabase.from('profiles').select('*').eq('id', uid).single(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('__timeout__')), 6000)
          ),
        ])
      } catch (e) {
        if (e?.message === '__timeout__') {
          setProfile(null)
          setProfileError(true)
          return
        }
        throw e
      }

      const { data, error } = result

      if (!error) {
        setProfile(data)
        writeCache(data)
        return
      }

      // PGRST116 = no profile row — create one automatically
      if (error.code === 'PGRST116') {
        const { data: created } = await supabase
          .from('profiles')
          .upsert({ id: uid, is_admin: false }, { onConflict: 'id' })
          .select()
          .single()
        setProfile(created || null)
        writeCache(created || null)
        return
      }

      console.error('Profile fetch error:', error.code, error.message)
      setProfile(null)
    } catch (e) {
      console.error('Profile fetch exception:', e?.message)
      setProfile(null)
    }
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function register(email, password, fullName, phone) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    })
    if (error) throw error
  }

  async function logout() {
    try { await supabase.auth.signOut() } catch (e) {}
    writeCache(null)
    setUser(null)
    setProfile(null)
    setProfileError(false)
    window.location.href = '/'
  }

  async function updateProfile(updates) {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (error) throw error
    setProfile(data)
    writeCache(data)
    return data
  }

  const isAdmin = profile?.is_admin === true

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      profileError,
      isAdmin,
      authModal,
      setAuthModal,
      login,
      register,
      logout,
      updateProfile,
      fetchProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
