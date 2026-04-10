'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { getUser, clearUser } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/env'
import type { User } from '@/types/database'

const HIDDEN_PREFIXES = ['/app', '/dashboard', '/admin', '/mesa']

function roleDestination(role: User['role']): string {
  switch (role) {
    case 'admin':
      return '/admin'
    case 'restaurante':
      return '/dashboard'
    case 'camarero':
      return '/dashboard/tpv'
    default:
      return '/app'
  }
}

function roleLabel(role: User['role']): string {
  switch (role) {
    case 'admin':
      return 'Panel admin'
    case 'restaurante':
      return 'Mi dashboard'
    case 'camarero':
      return 'Mi TPV'
    default:
      return 'Mi cuenta'
  }
}

export function GlobalNav() {
  const pathname = usePathname()
  const hide = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Read user from localStorage + listen to changes
  useEffect(() => {
    setUser(getUser())
    const onStorage = () => setUser(getUser())
    window.addEventListener('storage', onStorage)
    // Custom event fired after login in auth-provider
    window.addEventListener('df-auth-change', onStorage)
    // Poll shortly for async Supabase hydration
    const interval = setInterval(() => {
      const u = getUser()
      setUser((prev) => (prev?.id === u?.id ? prev : u))
    }, 1000)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('df-auth-change', onStorage)
      clearInterval(interval)
    }
  }, [])

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  async function handleLogout() {
    try {
      if (isSupabaseConfigured()) {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.error('Error signing out:', err)
    }
    clearUser()
    setUser(null)
    setMenuOpen(false)
    window.location.href = '/'
  }

  if (hide) return null

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={clsx(
        'sticky top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/[0.08] bg-background/90 backdrop-blur-md shadow-soft'
          : 'border-b border-white/[0.04] bg-background'
      )}
    >
      <nav className={clsx(
        'mx-auto flex max-w-6xl items-center justify-between px-4 transition-all duration-300 md:px-6',
        scrolled ? 'py-2' : 'py-3'
      )}>
        {/* Logo */}
        <a href="/" className="group flex items-center gap-2.5">
          <motion.span
            whileHover={{ scale: 1.08, rotate: 2 }}
            whileTap={{ scale: 0.95 }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white"
          >
            DF
          </motion.span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Dine<span className="text-accent">First</span>
          </span>
        </a>

        {/* Nav links */}
        <div className="flex items-center gap-2 text-xs md:text-sm md:gap-3">
          {user && (
            <a
              href="/app"
              className="link-underline hidden md:inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-foreground-subtle transition-colors hover:text-foreground"
            >
              Explorar
            </a>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {user ? (
              /* Logged-in: user menu */
              <motion.div
                key="user-menu"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="relative"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-border-subtle bg-background-elevated py-1 pl-1 pr-3 transition-colors hover:border-accent/40"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/20 text-[11px] font-semibold text-accent">
                    {user.name?.slice(0, 2).toUpperCase() || 'DF'}
                  </span>
                  <span className="hidden max-w-[120px] truncate text-xs font-medium text-foreground sm:inline">
                    {user.name || user.email}
                  </span>
                  <motion.span
                    animate={{ rotate: menuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-[10px] text-foreground-subtle"
                  >
                    ▼
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                      />
                      {/* Menu */}
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border-subtle bg-background-soft shadow-xl shadow-black/40"
                      >
                        <div className="border-b border-border-subtle p-3">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {user.name}
                          </p>
                          <p className="truncate text-[11px] text-foreground-subtle">
                            {user.email}
                          </p>
                          <span className="mt-2 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                            {user.role}
                          </span>
                        </div>
                        <div className="p-1">
                          <a
                            href={roleDestination(user.role)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-foreground-subtle transition hover:bg-background-elevated hover:text-foreground"
                          >
                            <span>◈</span>
                            <span>{roleLabel(user.role)}</span>
                          </a>
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-foreground-subtle transition hover:bg-red-500/10 hover:text-red-400"
                          >
                            <span>⏻</span>
                            <span>Cerrar sesión</span>
                          </button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* Logged-out: login + register */
              <motion.div
                key="auth-buttons"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 md:gap-3"
              >
                <motion.a
                  href="/login"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-secondary py-1.5 text-xs md:text-sm"
                >
                  Iniciar sesión
                </motion.a>
                <motion.a
                  href="/register"
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary py-1.5 text-xs md:text-sm"
                >
                  Registrarse
                </motion.a>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>
    </motion.header>
  )
}

export function GlobalFooter() {
  const pathname = usePathname()
  const hide = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  if (hide) return null

  return (
    <footer className="border-t border-white/[0.06] bg-background-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-5 text-xs text-foreground-subtle md:flex-row md:items-center md:justify-between md:px-6">
        <span>
          &copy; {new Date().getFullYear()}{' '}
          <span className="font-medium text-foreground">DineFirst</span>
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            Web &amp; Android (Capacitor)
          </span>
          <span>·</span>
          <span>Next.js 14</span>
        </div>
      </div>
    </footer>
  )
}
