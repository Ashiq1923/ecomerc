import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null)
  const [profile,      setProfile]      = useState(null)
  const [loading,      setLoading]      = useState(true)
  const [profileError, setProfileError] = useState(false)
  const [authModal,    setAuthModal]    = useState(false)

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION in Supabase v2,
    // so getSession() is NOT needed — using both causes fetchProfile to run twice,
    // which makes loading flash and hides admin features momentarily.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Token refresh doesn't change the user or profile — skip re-fetch
      if (event === 'TOKEN_REFRESHED') return

      setUser(session?.user ?? null)

      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setProfileError(false)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchProfile(uid) {
    setLoading(true)
    setProfileError(false)
    try {
      // Race between the query and a 10-second timeout
      // If RLS infinite recursion hangs the query, timeout fires and we show an error
      const { data, error } = await Promise.race([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timed out — RLS policy conflict')), 6000)
        ),
      ])

      if (error) {
        console.error('Profile fetch error:', error.message)
        setProfile(null)
        setProfileError(true)
      } else {
        setProfile(data)
        setProfileError(false)
      }
    } catch (e) {
      console.error('Profile fetch failed:', e?.message)
      setProfile(null)
      setProfileError(true)
    } finally {
      setLoading(false)
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
