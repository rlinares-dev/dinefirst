import type { Metadata } from 'next'
import { AuthProvider } from '@/components/providers/auth-provider'
import { ToastProvider } from '@/components/ui/toast'
import { GlobalNav, GlobalFooter } from '@/components/global-nav'
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import './../styles/globals.css'

export const metadata: Metadata = {
  title: 'DineFirst · Gestiona restaurantes de forma más inteligente',
  description:
    'Plataforma SaaS two-sided que conecta comensales con restaurantes, resolviendo la fragmentación operativa de la industria gastronómica.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'DineFirst · Reservas inteligentes para restaurantes',
    description:
      'Reserva en tiempo real, onboarding en 24h y dashboard operativo con analíticas para tu restaurante.',
    siteName: 'DineFirst',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DineFirst · Gestión inteligente de restaurantes',
    description: 'Plataforma SaaS que conecta comensales con restaurantes con reservas en tiempo real.',
    creator: '@dinefirst',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-foreground font-sans antialiased">
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col">
              <GlobalNav />
              <main className="flex-1">{children}</main>
              <GlobalFooter />
              <MobileBottomNav />
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
