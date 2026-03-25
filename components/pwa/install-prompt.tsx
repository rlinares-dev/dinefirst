'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if user previously dismissed
    if (localStorage.getItem('df_pwa_dismissed')) {
      setDismissed(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Don't show if already installed (standalone mode)
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone)

  if (!deferredPrompt || dismissed || isStandalone) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    setDeferredPrompt(null)
    localStorage.setItem('df_pwa_dismissed', '1')
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-slideUp rounded-xl border border-accent/30 bg-background-elevated p-4 shadow-deep sm:bottom-6 sm:left-auto sm:right-6">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-lg font-bold text-accent">
          DF
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Instalar DineFirst</p>
          <p className="mt-0.5 text-xs text-foreground-subtle">
            Accede m&aacute;s r&aacute;pido desde tu pantalla de inicio
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="btn-primary px-4 py-1.5 text-xs"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-full px-3 py-1.5 text-xs text-foreground-subtle hover:text-foreground transition"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
