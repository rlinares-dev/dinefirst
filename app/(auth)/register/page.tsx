'use client'

import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { useAuth } from '@/components/providers/auth-provider'
import { isSupabaseConfigured } from '@/lib/env'
import { emailWelcome } from '@/lib/email-client'
import { getUser as getLocalUser } from '@/lib/data'
import type { Role } from '@/types/database'

export default function RegisterPage() {
  const { signUp, signInWithGoogle, user } = useAuth()

  // Redirect if already logged in
  useEffect(() => {
    const u = user ?? getLocalUser()
    if (u) {
      if (u.role === 'admin') window.location.href = '/admin'
      else if (u.role === 'restaurante') window.location.href = '/dashboard'
      else if (u.role === 'camarero') window.location.href = '/dashboard/tpv'
      else window.location.href = '/app'
    }
  }, [user])
  const [step, setStep] = useState<1 | 2>(1)
  const [role, setRole] = useState<Role>('comensal')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [restaurantName, setRestaurantName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleRoleSelect(r: Role) {
    setRole(r)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    setLoading(true)
    setError('')

    const signUpRole: 'comensal' | 'restaurante' = (role === 'admin' || role === 'camarero') ? 'comensal' : role
    const result = await signUp({ email, password, name, role: signUpRole, phone })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    // Si es restaurante en modo localStorage, crear restaurante
    if (!isSupabaseConfigured() && role === 'restaurante' && restaurantName) {
      const { saveRestaurant, generateId, getUser } = require('@/lib/data')
      const u = getUser()
      if (u) {
        saveRestaurant({
          id: generateId(),
          ownerId: u.id,
          name: restaurantName,
          slug: restaurantName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          city: city || 'madrid',
          address: '', cuisineType: '', capacity: 20, description: '',
          plan: 'basic' as const, isActive: true, rating: 0, reviewCount: 0,
          phone, openingHours: '', createdAt: new Date().toISOString(),
        })
      }
    }

    // Enviar email de bienvenida (non-blocking)
    emailWelcome({ userName: name, userEmail: email, role: signUpRole })

    if (role === 'restaurante') window.location.href = '/dashboard'
    else window.location.href = '/app'
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
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
            Crear cuenta
          </h1>
          <p className="mt-1 text-sm text-foreground-subtle">
            Únete a DineFirst hoy mismo
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-3">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={clsx(
                'flex-1 h-1 rounded-full transition-colors',
                s <= step ? 'bg-accent' : 'bg-white/[0.08]'
              )}
            />
          ))}
        </div>

        {/* Step 1: Role selection */}
        {step === 1 && (
          <div>
            <p className="mb-5 text-center text-sm text-foreground-subtle">
              ¿Cómo vas a usar DineFirst?
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {([
                {
                  role: 'comensal' as Role,
                  icon: '🍽️',
                  title: 'Soy comensal',
                  desc: 'Quiero descubrir restaurantes y hacer reservas en tiempo real.',
                },
                {
                  role: 'restaurante' as Role,
                  icon: '🏠',
                  title: 'Tengo un restaurante',
                  desc: 'Quiero gestionar reservas, mesas y crecer digitalmente.',
                },
              ] as const).map((opt) => (
                <button
                  key={opt.role}
                  onClick={() => handleRoleSelect(opt.role)}
                  className="card flex flex-col items-start gap-3 text-left cursor-pointer"
                >
                  <span className="text-3xl">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {opt.title}
                    </p>
                    <p className="mt-1 text-xs text-foreground-subtle">
                      {opt.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-foreground-subtle">
              ¿Ya tienes cuenta?{' '}
              <a
                href="/login"
                className="font-medium text-accent hover:text-accent-soft"
              >
                Iniciar sesión
              </a>
            </p>
          </div>
        )}

        {/* Step 2: Registration form */}
        {step === 2 && (
          <div className="card">
            <div className="mb-5 flex items-center gap-3">
              <span className="text-2xl">
                {role === 'comensal' ? '🍽️' : '🏠'}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {role === 'comensal'
                    ? 'Cuenta de comensal'
                    : 'Cuenta de restaurante'}
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-accent hover:text-accent-soft"
                >
                  Cambiar tipo →
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label">Nombre completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Carlos Mendoza"
                  required
                  className="input w-full"
                />
              </div>

              {role === 'restaurante' && (
                <>
                  <div>
                    <label className="field-label">
                      Nombre del restaurante
                    </label>
                    <input
                      type="text"
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      placeholder="La Taberna del Chef"
                      required
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="field-label">Ciudad</label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      className="input w-full"
                    >
                      <option value="">Seleccionar ciudad…</option>
                      {[
                        'Madrid',
                        'Barcelona',
                        'Valencia',
                        'Sevilla',
                        'Bilbao',
                        'Málaga',
                        'Zaragoza',
                      ].map((c) => (
                        <option key={c} value={c.toLowerCase()}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="field-label">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="input w-full"
                />
              </div>

              <div>
                <label className="field-label">Teléfono</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+34 600 000 000"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="field-label">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
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
                {loading ? 'Creando cuenta…' : 'Crear cuenta'}
              </button>

              <p className="text-center text-xs text-foreground-subtle">
                Al registrarte aceptas los{' '}
                <span className="text-accent">Términos de uso</span> y la{' '}
                <span className="text-accent">Política de privacidad</span>.
              </p>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
