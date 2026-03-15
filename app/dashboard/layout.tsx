'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import clsx from 'clsx'
import { getUser, clearUser } from '@/lib/data'
import type { User } from '@/types/database'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Resumen', icon: '◈' },
  { href: '/dashboard/tpv', label: 'TPV', icon: '▣' },
  { href: '/dashboard/comandas', label: 'Comandas', icon: '▤' },
  { href: '/dashboard/mesas', label: 'Mesas', icon: '⊞' },
  { href: '/dashboard/menu', label: 'Menú', icon: '☰' },
  { href: '/dashboard/analiticas', label: 'Analíticas', icon: '◉' },
  { href: '/dashboard/facturacion', label: 'Facturación', icon: '◎' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [user, setCurrentUser] = useState<User | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const u = getUser()
    if (!u || u.role === 'comensal') {
      window.location.href = '/login'
      return
    }
    setCurrentUser(u)
  }, [])

  function handleLogout() {
    clearUser()
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
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-background">
            DF
          </span>
          <div>
            <p className="text-xs font-semibold text-foreground">DineFirst</p>
            <p className="text-xs text-foreground-subtle">Panel restaurante</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={clsx(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                      active
                        ? 'bg-accent/10 text-accent font-medium'
                        : 'text-foreground-subtle hover:bg-background-elevated hover:text-foreground',
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </a>
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
            {NAV_ITEMS.find((n) => n.href === pathname)?.label ?? 'Dashboard'}
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-xs text-foreground-subtle hover:text-accent">
              ← Ir al inicio
            </a>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
