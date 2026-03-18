'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const HIDDEN_PREFIXES = ['/app', '/dashboard', '/admin', '/mesa']

export function GlobalNav() {
  const pathname = usePathname()
  const hide = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
          <a
            href="/app"
            className="link-underline hidden md:inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-foreground-subtle transition-colors hover:text-foreground"
          >
            Explorar
          </a>
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
