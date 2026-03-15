'use client'

import { usePathname } from 'next/navigation'

const HIDDEN_PREFIXES = ['/app', '/dashboard', '/admin', '/mesa']

export function GlobalNav() {
  const pathname = usePathname()
  const hide = HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))
  if (hide) return null

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <a href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-xs font-bold text-white">
            DF
          </span>
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Dine<span className="text-accent">First</span>
          </span>
        </a>

        {/* Nav links */}
        <div className="flex items-center gap-2 text-xs md:text-sm md:gap-3">
          <a
            href="/app"
            className="hidden md:inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-foreground-subtle transition-colors hover:bg-white/[0.04] hover:text-foreground"
          >
            Explorar
          </a>
          <a href="/login" className="btn-secondary py-1.5 text-xs md:text-sm">
            Iniciar sesión
          </a>
          <a href="/register" className="btn-primary py-1.5 text-xs md:text-sm">
            Registrarse
          </a>
        </div>
      </nav>
    </header>
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
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Web &amp; Android (Capacitor)
          </span>
          <span>·</span>
          <span>Next.js 14</span>
        </div>
      </div>
    </footer>
  )
}
