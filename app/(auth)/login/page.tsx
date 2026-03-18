'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/providers/auth-provider'
import { isSupabaseConfigured } from '@/lib/env'
import { getRestaurantSlugs } from '@/lib/data'
import { sbGetRestaurantSlugs } from '@/lib/supabase-data'

type LoginMode = 'email' | 'camarero'

export default function LoginPage() {
  const { signIn, signInCamarero, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<LoginMode>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [restaurantSlug, setRestaurantSlug] = useState('')
  const [slugs, setSlugs] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadSlugs() {
      const s = isSupabaseConfigured() ? await sbGetRestaurantSlugs() : getRestaurantSlugs()
      setSlugs(s)
      if (s.length > 0) setRestaurantSlug(s[0])
    }
    loadSlugs()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    let result: { error: string | null }

    if (mode === 'camarero') {
      result = await signInCamarero(username, password, restaurantSlug)
    } else {
      result = await signIn(email, password)
    }

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (isSupabaseConfigured()) {
      // In Supabase mode, fetch profile to determine redirect
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authUser.id).single()
        const role = profile?.role ?? 'comensal'
        if (role === 'admin') window.location.href = '/admin'
        else if (role === 'restaurante') window.location.href = '/dashboard'
        else if (role === 'camarero') window.location.href = '/dashboard/tpv'
        else window.location.href = '/app'
        return
      }
    }

    setTimeout(() => {
      const { getUser } = require('@/lib/data')
      const u = getUser()
      if (u?.role === 'admin') window.location.href = '/admin'
      else if (u?.role === 'restaurante') window.location.href = '/dashboard'
      else if (u?.role === 'camarero') window.location.href = '/dashboard/tpv'
      else window.location.href = '/app'
    }, 100)
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo + heading */}
        <div className="mb-8 text-center">
          <a
            href="/"
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-base font-bold text-white"
          >
            DF
          </a>
          <h1 className="mt-5 text-2xl font-semibold text-foreground">
            Bienvenido de nuevo
          </h1>
          <p className="mt-1 text-sm text-foreground-subtle">
            Inicia sesión en tu cuenta DineFirst
          </p>
        </div>

        {/* Card */}
        <div className="card">
          {/* Google OAuth */}
          {isSupabaseConfigured() && (
            <>
              <button
                onClick={() => signInWithGoogle()}
                className="btn-secondary w-full py-3 flex items-center justify-center gap-3 mb-4"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-xs text-foreground-subtle">o con credenciales</span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>
            </>
          )}

          {/* Login mode tabs */}
          <div className="flex mb-6 rounded-lg border border-border-subtle overflow-hidden">
            <button
              type="button"
              onClick={() => { setMode('email'); setError('') }}
              className={`flex-1 py-2 text-xs font-medium transition ${
                mode === 'email'
                  ? 'bg-accent text-white'
                  : 'bg-background-elevated text-foreground-subtle hover:text-foreground'
              }`}
            >
              Propietario / Comensal
            </button>
            <button
              type="button"
              onClick={() => { setMode('camarero'); setError('') }}
              className={`flex-1 py-2 text-xs font-medium transition ${
                mode === 'camarero'
                  ? 'bg-accent text-white'
                  : 'bg-background-elevated text-foreground-subtle hover:text-foreground'
              }`}
            >
              Camarero
            </button>
          </div>

          {/* Demo accounts info */}
          <div className="mb-6 rounded-xl border border-accent/20 bg-accent/[0.06] px-4 py-3 text-xs">
            <p className="font-semibold text-foreground mb-1.5">
              Cuentas de demo:
            </p>
            {mode === 'email' ? (
              <>
                <p className="text-foreground-subtle leading-relaxed">
                  🍽️ comensal@demo.com · password123
                </p>
                <p className="text-foreground-subtle leading-relaxed">
                  🏠 restaurante@demo.com · password123
                </p>
                <p className="text-foreground-subtle leading-relaxed">
                  ⚙️ admin@dinefirst.com · password123
                </p>
              </>
            ) : (
              <>
                <p className="text-foreground-subtle leading-relaxed">
                  👨‍🍳 Restaurante: <span className="text-foreground">la-taberna-del-chef</span>
                </p>
                <p className="text-foreground-subtle leading-relaxed">
                  &nbsp;&nbsp;&nbsp;&nbsp;Usuario: <span className="text-foreground">elena</span> · password123
                </p>
                <p className="text-foreground-subtle leading-relaxed">
                  &nbsp;&nbsp;&nbsp;&nbsp;Usuario: <span className="text-foreground">diego</span> · password123
                </p>
              </>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'email' ? (
              <div>
                <label className="field-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@restaurante.com"
                  required
                  className="input w-full"
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="field-label">Restaurante</label>
                  <select
                    value={restaurantSlug}
                    onChange={(e) => setRestaurantSlug(e.target.value)}
                    required
                    className="input w-full"
                  >
                    {slugs.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label">Usuario</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="nombre de usuario"
                    required
                    autoComplete="username"
                    className="input w-full"
                  />
                </div>
              </>
            )}

            <div>
              <label className="field-label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input w-full"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-2.5 text-xs text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-60"
            >
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </button>
          </form>

          {mode === 'email' && (
            <p className="mt-5 text-center text-xs text-foreground-subtle">
              ¿No tienes cuenta?{' '}
              <a
                href="/register"
                className="font-medium text-accent hover:text-accent-soft"
              >
                Regístrate gratis
              </a>
            </p>
          )}

          {mode === 'camarero' && (
            <p className="mt-5 text-center text-xs text-foreground-subtle">
              Tu usuario y contraseña los proporciona el propietario del restaurante.
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
