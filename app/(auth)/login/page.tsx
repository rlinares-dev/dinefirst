'use client'

import { useState } from 'react'
import { loginWithCredentials, setUser } from '@/lib/data'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    const user = loginWithCredentials(email, password)
    if (!user) {
      setError('Credenciales incorrectas. Prueba las cuentas de demo.')
      setLoading(false)
      return
    }
    setUser(user)
    if (user.role === 'admin') window.location.href = '/admin'
    else if (user.role === 'restaurante') window.location.href = '/dashboard'
    else window.location.href = '/app'
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
          {/* Demo accounts info */}
          <div className="mb-6 rounded-xl border border-accent/20 bg-accent/[0.06] px-4 py-3 text-xs">
            <p className="font-semibold text-foreground mb-1.5">
              Cuentas de demo disponibles:
            </p>
            <p className="text-foreground-subtle leading-relaxed">
              🍽️ comensal@demo.com · password123
            </p>
            <p className="text-foreground-subtle leading-relaxed">
              🏠 restaurante@demo.com · password123
            </p>
            <p className="text-foreground-subtle leading-relaxed">
              ⚙️ admin@dinefirst.com · password123
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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

          <p className="mt-5 text-center text-xs text-foreground-subtle">
            ¿No tienes cuenta?{' '}
            <a
              href="/register"
              className="font-medium text-accent hover:text-accent-soft"
            >
              Regístrate gratis
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
