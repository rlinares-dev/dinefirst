'use client'

import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const NAV_ITEMS = [
  { href: '/app', label: 'Inicio', icon: '🏠', match: '/app' },
  { href: '/app', label: 'Buscar', icon: '🔍', match: '/app#search' },
  { href: '/app/reservas', label: 'Reservas', icon: '📅', match: '/app/reservas' },
  { href: '/app/perfil', label: 'Perfil', icon: '👤', match: '/app/perfil' },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  // Only show on /app routes
  if (!pathname.startsWith('/app')) return null

  return (
    <motion.nav
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-background/95 backdrop-blur-sm lg:hidden"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.match || (item.match === '/app' && pathname === '/app')
          return (
            <a
              key={item.label}
              href={item.href}
              className={clsx(
                'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active
                  ? 'text-accent'
                  : 'text-foreground-subtle hover:text-foreground'
              )}
            >
              <motion.span
                className="text-lg leading-none"
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {item.icon}
              </motion.span>
              <span>{item.label}</span>
              {active && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  className="mt-0.5 h-0.5 w-4 rounded-full bg-accent"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </a>
          )
        })}
      </div>
      {/* Safe area for iPhone notch */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </motion.nav>
  )
}
