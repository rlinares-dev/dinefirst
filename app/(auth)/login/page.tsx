'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useAuth } from '@/components/providers/auth-provider'
import { isSupabaseConfigured } from '@/lib/env'
import { getRestaurantSlugs, getUser } from '@/lib/data'
import { sbGetRestaurantSlugs } from '@/lib/supabase-data'

type AccountType = 'comensal' | 'negocio'
type BusinessRole = 'propietario' | 'empleado'

function redirectByRole(role: string | undefined) {
  if (role === 'admin') window.location.href = '/admin'
  else if (role === 'restaurante') window.location.href = '/dashboard'
  else if (role === 'camarero') window.location.href = '/dashboard/tpv'
  else window.location.href = '/app'
}

export default function LoginPage() {
  const { signIn, signInCamarero, signInWithGoogle, user } = useAuth()
  const [accountType, setAccountType] = useState<AccountType>('comensal')
  const [businessRole, setBusinessRole] = useState<BusinessRole>('propietario')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [restaurantSlug, setRestaurantSlug] = useState('')
  const [slugs, setSlugs] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tabDirection, setTabDirection] = useState(1) // for slide animation direction

  // Redirect if already logged in
  useEffect(() => {
    const u = user ?? getUser()
    if (u) redirectByRole(u.role)
  }, [user])

  useEffect(() => {
    async function loadSlugs() {
      const s = isSupabaseConfigured() ? await sbGetRestaurantSlugs() : getRestaurantSlugs()
      setSlugs(s)
      if (s.length > 0) setRestaurantSlug(s[0])
    }
    loadSlugs()
  }, [])

  function switchAccountType(next: AccountType) {
    if (next === accountType) return
    setTabDirection(next === 'negocio' ? 1 : -1)
    setAccountType(next)
    setError('')
  }

  function switchBusinessRole(next: BusinessRole) {
    if (next === businessRole) return
    setBusinessRole(next)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const isCamarero = accountType === 'negocio' && businessRole === 'empleado'
    const result = isCamarero
      ? await signInCamarero(username, password, restaurantSlug)
      : await signIn(email, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (isSupabaseConfigured()) {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', authUser.id).single()
        redirectByRole(profile?.role)
        return
      }
    }

    setTimeout(() => {
      const u = getUser()
      redirectByRole(u?.role)
    }, 100)
  }

  // Form variants for the "wow" animation
  const formVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 80 : -80,
      opacity: 0,
      scale: 0.92,
      rotateY: dir > 0 ? 25 : -25,
      filter: 'blur(8px)',
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring' as const,
        stiffness: 320,
        damping: 28,
        mass: 0.9,
      },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -80 : 80,
      opacity: 0,
      scale: 0.92,
      rotateY: dir > 0 ? -25 : 25,
      filter: 'blur(8px)',
      transition: {
        duration: 0.25,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      },
    }),
  }

  const subRoleVariants = {
    enter: { opacity: 0, y: 10, scale: 0.97 },
    center: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: 'spring' as const, stiffness: 380, damping: 26 },
    },
    exit: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.18 } },
  }

  const isCamareroMode = accountType === 'negocio' && businessRole === 'empleado'
  const formKey = isCamareroMode ? 'camarero' : accountType === 'negocio' ? 'negocio-propietario' : 'comensal'

  return (
    <main className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center px-6 py-12">
      {/* Ambient background glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: accountType === 'negocio' ? 80 : -80,
            opacity: 0.35,
          }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
          className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent blur-[160px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        {/* Logo (small, no title) */}
        <div className="mb-6 flex justify-center">
          <motion.a
            href="/"
            whileHover={{ scale: 1.08, rotate: -3 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-base font-bold text-white shadow-lg shadow-accent/30"
          >
            DF
          </motion.a>
        </div>

        {/* Card */}
        <div className="card" style={{ perspective: 1200 }}>
          {/* Google OAuth */}
          {isSupabaseConfigured() && !isCamareroMode && (
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

          {/* Main tabs: Comensal / Negocio */}
          <LayoutGroup id="auth-tabs">
            <div className="relative mb-4 flex rounded-xl border border-border-subtle bg-background-elevated p-1">
              {(['comensal', 'negocio'] as AccountType[]).map((t) => {
                const active = accountType === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchAccountType(t)}
                    className={`relative z-10 flex-1 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
                      active ? 'text-white' : 'text-foreground-subtle hover:text-foreground'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="auth-tab-pill"
                        className="absolute inset-0 rounded-lg bg-accent shadow-lg shadow-accent/30"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative flex items-center justify-center gap-2">
                      <span className="text-sm">{t === 'comensal' ? '🍽️' : '🏪'}</span>
                      <span>{t === 'comensal' ? 'Comensal' : 'Negocio'}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Sub-toggle inside Negocio */}
            <AnimatePresence initial={false}>
              {accountType === 'negocio' && (
                <motion.div
                  key="business-subroles"
                  initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{ height: 'auto', opacity: 1, marginBottom: 16 }}
                  exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="relative flex rounded-lg border border-border-subtle/60 bg-background/60 p-0.5">
                    {(['propietario', 'empleado'] as BusinessRole[]).map((r) => {
                      const active = businessRole === r
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => switchBusinessRole(r)}
                          className={`relative z-10 flex-1 py-1.5 text-[11px] font-medium capitalize transition-colors ${
                            active ? 'text-accent' : 'text-foreground-subtle hover:text-foreground'
                          }`}
                        >
                          {active && (
                            <motion.span
                              layoutId="business-role-pill"
                              className="absolute inset-0 rounded-md border border-accent/40 bg-accent/10"
                              transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                            />
                          )}
                          <span className="relative">{r === 'propietario' ? '👔 Propietario' : '👨‍🍳 Empleado'}</span>
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>

          {/* Demo accounts info */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`demo-${formKey}`}
              variants={subRoleVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="mb-5 rounded-xl border border-accent/20 bg-accent/[0.06] px-4 py-3 text-xs"
            >
              <p className="font-semibold text-foreground mb-1.5">Cuentas de demo:</p>
              {accountType === 'comensal' && (
                <p className="text-foreground-subtle leading-relaxed">
                  🍽️ comensal@demo.com · password123
                </p>
              )}
              {accountType === 'negocio' && businessRole === 'propietario' && (
                <>
                  <p className="text-foreground-subtle leading-relaxed">
                    🏠 restaurante@demo.com · password123
                  </p>
                  <p className="text-foreground-subtle leading-relaxed">
                    ⚙️ admin@dinefirst.com · password123
                  </p>
                </>
              )}
              {isCamareroMode && (
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
            </motion.div>
          </AnimatePresence>

          {/* Animated form */}
          <div className="relative" style={{ transformStyle: 'preserve-3d' }}>
            <AnimatePresence mode="wait" custom={tabDirection}>
              <motion.form
                key={formKey}
                custom={tabDirection}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={handleSubmit}
                className="space-y-4"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {isCamareroMode ? (
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
                ) : (
                  <div>
                    <label className="field-label">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={accountType === 'comensal' ? 'tu@email.com' : 'tu@restaurante.com'}
                      required
                      className="input w-full"
                    />
                  </div>
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
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-2.5 text-xs text-red-400"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full py-3 disabled:opacity-60"
                >
                  {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
                </motion.button>
              </motion.form>
            </AnimatePresence>
          </div>

          {!isCamareroMode && (
            <p className="mt-5 text-center text-xs text-foreground-subtle">
              ¿No tienes cuenta?{' '}
              <a href="/register" className="font-medium text-accent hover:text-accent-soft">
                Regístrate gratis
              </a>
            </p>
          )}

          {isCamareroMode && (
            <p className="mt-5 text-center text-xs text-foreground-subtle">
              Tu usuario y contraseña los proporciona el propietario del restaurante.
            </p>
          )}
        </div>
      </motion.div>
    </main>
  )
}
