'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { isSupabaseConfigured } from '@/lib/env'
import type { User } from '@/types/database'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signInCamarero: (username: string, password: string, restaurantSlug: string) => Promise<{ error: string | null }>
  signUp: (data: SignUpData) => Promise<{ error: string | null }>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

interface SignUpData {
  email: string
  password: string
  name: string
  role: 'comensal' | 'restaurante'
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper para mapear profile de Supabase a User de la app
function profileToUser(profile: {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  created_at: string
  username?: string | null
  restaurant_id?: string | null
}): User {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as User['role'],
    phone: profile.phone || '',
    createdAt: profile.created_at,
    ...(profile.restaurant_id ? { restaurantId: profile.restaurant_id } : {}),
    ...(profile.username ? { username: profile.username } : {}),
  }
}

// Sincroniza el user a localStorage para que `lib/data.getUser()` funcione
// en páginas que leen directamente sin usar el context (dashboard layout, etc.)
function syncUserToLocalStorage(user: User | null) {
  if (typeof window === 'undefined') return
  try {
    const { setUser: saveUser, clearUser } = require('@/lib/data')
    if (user) saveUser(user)
    else clearUser()
    // Notify other components (like GlobalNav) to re-read user
    window.dispatchEvent(new CustomEvent('df-auth-change'))
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Wrapper que sincroniza React state + localStorage
  const setUser = useCallback((u: User | null) => {
    setUserState(u)
    syncUserToLocalStorage(u)
  }, [])

  // Inicializar auth
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      // Modo localStorage
      try {
        const { getUser } = require('@/lib/data')
        setUser(getUser())
      } catch {
        // lib/data no disponible en server
      }
      setLoading(false)
      return
    }

    // Modo Supabase
    let subscription: { unsubscribe: () => void } | null = null

    const init = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()

        // Cargar sesión actual
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()
          if (profile) setUser(profileToUser(profile))
        }

        // Listener para cambios de auth
        const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            if (profile) setUser(profileToUser(profile))
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
          }
        })
        subscription = data.subscription
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      const { loginWithCredentials, setUser: saveUser } = require('@/lib/data')
      const u = loginWithCredentials(email, password)
      if (!u) return { error: 'Credenciales incorrectas. Prueba las cuentas de demo.' }
      saveUser(u)
      setUser(u)
      return { error: null }
    }

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const signInCamarero = useCallback(async (username: string, password: string, restaurantSlug: string) => {
    // Fallback al mock local — funciona en dev con o sin Supabase.
    const tryMockLogin = () => {
      const { loginCamarero, setUser: saveUser } = require('@/lib/data')
      const u = loginCamarero(username, password, restaurantSlug)
      if (!u) return { error: 'Usuario, contraseña o restaurante incorrectos.' }
      saveUser(u)
      setUser(u)
      return { error: null }
    }

    if (!isSupabaseConfigured()) {
      return tryMockLogin()
    }

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Find restaurant by slug
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', restaurantSlug)
        .single()

      // Si el restaurante no existe en Supabase (p.ej. cuentas demo
      // que solo viven en el mock), intentamos con localStorage.
      if (!restaurant) {
        console.info('[signInCamarero] Restaurante no en Supabase, fallback a mock')
        return tryMockLogin()
      }

      // Find camarero profile by username + restaurant
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'camarero')
        .eq('username', username)
        .eq('restaurant_id', restaurant.id)
        .single()

      if (!profile?.email) {
        console.info('[signInCamarero] Camarero no en Supabase, fallback a mock')
        return tryMockLogin()
      }

      // Sign in with the internal email
      const { error } = await supabase.auth.signInWithPassword({ email: profile.email, password })
      if (error) {
        // Si Supabase rechaza, probamos mock como último recurso.
        console.info('[signInCamarero] Supabase auth falló, fallback a mock:', error.message)
        return tryMockLogin()
      }
      return { error: null }
    } catch (err) {
      console.error('signInCamarero error, fallback a mock:', err)
      return tryMockLogin()
    }
  }, [])

  const signUp = useCallback(async (data: SignUpData) => {
    if (!isSupabaseConfigured()) {
      const { generateId, setUser: saveUser } = require('@/lib/data')
      const newUser: User = {
        id: generateId(),
        name: data.name,
        email: data.email,
        role: data.role,
        phone: data.phone || '',
        createdAt: new Date().toISOString(),
      }
      saveUser(newUser)
      setUser(newUser)
      return { error: null }
    }

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
          phone: data.phone || '',
        },
      },
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) return

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }, [])

  const signOut = useCallback(async () => {
    const { logout } = require('@/lib/data')
    await logout()
    setUser(null)
    window.location.href = '/'
  }, [])

  const refreshUser = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      const { getUser } = require('@/lib/data')
      setUser(getUser())
      return
    }

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      if (profile) setUser(profileToUser(profile))
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signInCamarero,
        signUp,
        signInWithGoogle,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
