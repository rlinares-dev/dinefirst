'use client'

import { useEffect, useLayoutEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { getUser, logout } from '@/lib/data'
import type { User, Role } from '@/types/database'
import { usePushNotifications } from '@/lib/hooks/use-push-notifications'
import ChatWidget from '@/components/chat/chat-widget'

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const ALL_NAV_ITEMS: { href: string; label: string; icon: string; roles: Role[] }[] = [
  { href: '/dashboard', label: 'Resumen', icon: '◈', roles: ['restaurante', 'admin', 'camarero'] },
  { href: '/dashboard/tpv', label: 'TPV', icon: '▣', roles: ['restaurante', 'admin', 'camarero'] },
  { href: '/dashboard/comandas', label: 'Comandas', icon: '▤', roles: ['restaurante', 'admin', 'camarero'] },
  { href: '/dashboard/mesas', label: 'Mesas', icon: '⊞', roles: ['restaurante', 'admin', 'camarero'] },
  { href: '/dashboard/menu', label: 'Menú', icon: '☰', roles: ['restaurante', 'admin', 'camarero'] },
  { href: '/dashboard/resenas', label: 'Reseñas', icon: '★', roles: ['restaurante', 'admin', 'camarero'] },
  { href: '/dashboard/historial', label: 'Historial', icon: '▦', roles: ['restaurante', 'admin'] },
  { href: '/dashboard/equipo', label: 'Equipo', icon: '◇', roles: ['restaurante', 'admin'] },
  { href: '/dashboard/perfil', label: 'Perfil', icon: '◐', roles: ['restaurante', 'admin'] },
  { href: '/dashboard/analiticas', label: 'Analíticas', icon: '◉', roles: ['restaurante', 'admin'] },
  { href: '/dashboard/facturacion', label: 'Facturación', icon: '◎', roles: ['restaurante', 'admin'] },
]

const RESTRICTED_ROUTES = ['/dashboard/analiticas', '/dashboard/facturacion', '/dashboard/perfil', '/dashboard/equipo']

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setCurrentUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pushBannerDismissed, setPushBannerDismissed] = useState(false)
  const push = usePushNotifications()

  // Sync read from localStorage before paint — avoids flash AND hydration mismatch
  useIsomorphicLayoutEffect(() => {
    const u = getUser()
    setCurrentUser(u)
  }, [])

  // Re-check user when AuthProvider hydrates from Supabase (async)
  useEffect(() => {
    if (user) return
    let attempts = 0
    const interval = setInterval(() => {
      const u = getUser()
      if (u) {
        setCurrentUser(u)
        clearInterval(interval)
      } else if (++attempts > 30) {
        clearInterval(interval)
        router.replace('/login')
      }
    }, 150)
    return () => clearInterval(interval)
  }, [user, router])

  useEffect(() => {
    if (!user) return
    if (user.role === 'comensal') {
      router.replace('/login')
      return
    }
    if (user.role === 'camarero' && RESTRICTED_ROUTES.some((r) => pathname.startsWith(r))) {
      router.replace('/dashboard/tpv')
    }
  }, [user, pathname, router])

  async function handleLogout() {
    await logout()
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border-subtle bg-background-soft transition-transform duration-300 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-border-subtle px-5">
          <motion.span
            whileHover={{ scale: 1.08, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-background"
          >
            DF
          </motion.span>
          <div>
            <p className="text-xs font-semibold text-foreground">DineFirst</p>
            <p className="text-xs text-foreground-subtle">Panel restaurante</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {ALL_NAV_ITEMS.filter((item) => user && item.roles.includes(user.role)).map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'text-accent font-medium'
                        : 'text-foreground-subtle hover:bg-background-elevated hover:text-foreground',
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-accent/10"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative text-base">{item.icon}</span>
                    <span className="relative">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User info */}
        <div className="border-t border-border-subtle p-4">
          {user && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-xs font-semibold text-accent">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">{user.name}</p>
                <p className="truncate text-xs text-foreground-subtle">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full rounded-md border border-border-subtle px-3 py-1.5 text-xs text-foreground-subtle transition hover:border-red-500/30 hover:text-red-400"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-border-subtle bg-background-soft/80 px-4 backdrop-blur-sm lg:px-6">
          <button
            className="text-foreground-subtle hover:text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="hidden lg:block text-sm text-foreground-subtle">
            {ALL_NAV_ITEMS.find((n) => n.href === pathname)?.label ?? 'Dashboard'}
          </div>
          <div className="flex items-center gap-3">
            {/* Push notification bell */}
            {push.isSupported && (
              <button
                onClick={() => {
                  if (push.isSubscribed) push.unsubscribe()
                  else push.subscribe()
                }}
                className={clsx(
                  'relative flex h-8 w-8 items-center justify-center rounded-lg text-sm transition',
                  push.isSubscribed
                    ? 'bg-accent/10 text-accent'
                    : 'text-foreground-subtle hover:text-foreground',
                )}
                title={push.isSubscribed ? 'Notificaciones activadas' : 'Activar notificaciones'}
              >
                🔔
                {push.isSubscribed && (
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-400" />
                )}
              </button>
            )}
            <Link href="/" className="text-xs text-foreground-subtle hover:text-accent">
              ← Ir al inicio
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-md border border-border-subtle px-3 py-1.5 text-xs text-foreground-subtle transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
              title="Cerrar sesión"
            >
              <span>⏻</span>
              <span className="hidden sm:inline">Cerrar sesión</span>
            </button>
          </div>
        </header>

        {/* Push notification banner */}
        {push.isSupported && !push.isSubscribed && !push.loading && !pushBannerDismissed && (
          <div className="flex items-center justify-between gap-3 border-b border-accent/20 bg-accent/[0.06] px-4 py-2.5">
            <p className="text-xs text-foreground-subtle">
              🔔 <span className="font-medium text-foreground">Activa las notificaciones</span> para recibir alertas de pedidos y cuentas en tiempo real
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => push.subscribe()}
                className="rounded-md bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-strong transition"
              >
                Activar
              </button>
              <button
                onClick={() => setPushBannerDismissed(true)}
                className="text-xs text-foreground-subtle hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {children}
          </motion.div>
        </main>

        {/* AI Chat Widget — bottom bar, role check handled internally */}
        <ChatWidget />
      </div>
    </div>
  )
}
