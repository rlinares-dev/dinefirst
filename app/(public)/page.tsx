'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import clsx from 'clsx'

const FEATURED_RESTAURANTS = [
  {
    name: 'La Taberna del Chef',
    cuisine: 'Española',
    emoji: '🥘',
    rating: 4.7,
    reviews: 234,
    city: 'Madrid',
    slug: '/restaurantes/madrid/la-taberna-del-chef',
    priceRange: '€€€',
    tags: ['De autor', 'Terraza'],
    highlight: 'Mejor restaurante Madrid 2025',
  },
  {
    name: 'El Rincón de la Abuela',
    cuisine: 'Catalana',
    emoji: '🍳',
    rating: 4.9,
    reviews: 512,
    city: 'Barcelona',
    slug: '/restaurantes/barcelona/el-rincon-de-la-abuela',
    priceRange: '€€',
    tags: ['Familiar', 'Tradicional'],
    highlight: 'Top valorado en Barcelona',
  },
  {
    name: 'Sake & Fusion',
    cuisine: 'Japonesa',
    emoji: '🍱',
    rating: 4.8,
    reviews: 178,
    city: 'Valencia',
    slug: '/restaurantes/valencia/sake-and-fusion',
    priceRange: '€€€€',
    tags: ['Fusión', 'Omakase'],
    highlight: 'Experiencia omakase única',
  },
  {
    name: 'Café Central',
    cuisine: 'Cafetería',
    emoji: '☕',
    rating: 4.6,
    reviews: 340,
    city: 'Madrid',
    slug: '/app',
    priceRange: '€',
    tags: ['Brunch', 'Specialty Coffee'],
    highlight: 'Mejor brunch de Madrid',
  },
  {
    name: 'La Trattoria Bella',
    cuisine: 'Italiana',
    emoji: '🍕',
    rating: 4.5,
    reviews: 289,
    city: 'Sevilla',
    slug: '/app',
    priceRange: '€€',
    tags: ['Pizza', 'Pasta fresca'],
    highlight: 'Pizza napolitana auténtica',
  },
  {
    name: 'Mar y Tierra',
    cuisine: 'Mediterránea',
    emoji: '🦐',
    rating: 4.7,
    reviews: 198,
    city: 'Barcelona',
    slug: '/app',
    priceRange: '€€€',
    tags: ['Mariscos', 'Vista al mar'],
    highlight: 'Terraza con vistas al mar',
  },
]

const FEATURES = [
  {
    icon: '\u26A1',
    title: 'Reservas en tiempo real',
    description:
      'Disponibilidad actualizada al instante. Sin llamadas, sin emails, sin esperas. Confirmaci\u00F3n autom\u00E1tica por WhatsApp y email.',
  },
  {
    icon: '\uD83D\uDE80',
    title: 'Onboarding en 24 horas',
    description:
      'Tu restaurante visible en la plataforma en menos de un d\u00EDa. Sin contratos largos, sin comisiones por reserva.',
  },
  {
    icon: '\uD83D\uDCCA',
    title: 'Dashboard operativo unificado',
    description:
      'Gesti\u00F3n de mesas, men\u00FA, reservas y anal\u00EDticas en un solo lugar. Olv\u00EDdate de las hojas de Excel.',
  },
  {
    icon: '\uD83D\uDCAC',
    title: 'Notificaciones WhatsApp',
    description:
      'Confirmaci\u00F3n, recordatorio 24h antes y alerta de no-show. Tus clientes siempre informados sin esfuerzo.',
  },
  {
    icon: '\uD83D\uDD0D',
    title: 'SEO propio',
    description:
      'Cada restaurante tiene su p\u00E1gina indexada. Sin depender de ecosistemas ajenos ni pagar por visibilidad.',
  },
  {
    icon: '\uD83D\uDEE1\uFE0F',
    title: 'Sin comisiones',
    description:
      'Paga solo tu plan mensual. Sin porcentaje por reserva, sin sorpresas en la factura.',
  },
]

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49,
    description: 'Para restaurantes que empiezan',
    features: ['Hasta 20 mesas', 'Reservas ilimitadas', 'Perfil p\u00FAblico SEO', 'Email de confirmaci\u00F3n', 'Soporte por email'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    description: 'El m\u00E1s popular para negocios activos',
    features: ['Mesas ilimitadas', 'Reservas ilimitadas', 'Perfil p\u00FAblico SEO', 'WhatsApp + Email', 'Anal\u00EDticas b\u00E1sicas', 'Soporte prioritario'],
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    description: 'Para cadenas y grupos de restauraci\u00F3n',
    features: ['Multi-restaurante', 'Mesas ilimitadas', 'Anal\u00EDticas avanzadas + IA', 'WhatsApp + Email + SMS', 'API acceso completo', 'Account manager dedicado'],
    highlighted: false,
  },
]

const TESTIMONIALS = [
  {
    name: 'Carlos Mendoza',
    role: 'Chef propietario \u00B7 La Taberna del Chef',
    text: 'Pasamos de gestionar reservas en WhatsApp a tener todo automatizado en dos d\u00EDas. Las cancelaciones bajaron un 40%.',
  },
  {
    name: 'Luc\u00EDa Ferrer',
    role: 'Gerente \u00B7 Grupo Ferrer Hospitality',
    text: 'Con DineFirst consolidamos 5 restaurantes en un mismo dashboard. Ahorramos 12 horas a la semana en gesti\u00F3n operativa.',
  },
  {
    name: 'Ahmed Bouaziz',
    role: 'Director \u00B7 Sake & Fusion',
    text: 'El onboarding fue incre\u00EDblemente r\u00E1pido. En 24 horas ya ten\u00EDamos reservas entrando desde la web.',
  },
]

const STATS = [
  { value: '120+', label: 'Restaurantes' },
  { value: '50k+', label: 'Reservas gestionadas' },
  { value: '4.9', label: 'Rating promedio' },
  { value: '24h', label: 'Tiempo de alta' },
]

const FAQS = [
  {
    q: '\u00BFDineFirst cobra comisi\u00F3n por cada reserva?',
    a: 'No. DineFirst funciona con suscripci\u00F3n mensual plana. Nunca pagar\u00E1s comisi\u00F3n por reserva, independientemente de cu\u00E1ntas gestiones hagas.',
  },
  {
    q: '\u00BFCu\u00E1nto tiempo lleva el alta?',
    a: 'Menos de 24 horas. Rellena el formulario de onboarding, nosotros revisamos tu perfil y lo publicamos. Sin contratos de permanencia.',
  },
  {
    q: '\u00BFFunciona para cadenas con varios restaurantes?',
    a: 'S\u00ED, el plan Premium est\u00E1 dise\u00F1ado para grupos de restauraci\u00F3n. Gestiona m\u00FAltiples locales desde un \u00FAnico panel.',
  },
  {
    q: '\u00BFPuedo cancelar cuando quiera?',
    a: 'S\u00ED. Cancelaci\u00F3n sin penalizaci\u00F3n en cualquier momento desde el panel de facturaci\u00F3n. Sin permanencias.',
  },
]

function FeaturedCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const totalSlides = FEATURED_RESTAURANTS.length
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollToIdx = useCallback((idx: number) => {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[0] as HTMLElement | undefined
    if (!card) return
    const gap = 20
    const cardW = card.offsetWidth + gap
    el.scrollTo({ left: cardW * idx, behavior: 'smooth' })
    setActiveIdx(idx)
  }, [])

  const next = useCallback(() => {
    setActiveIdx((prev) => {
      const n = (prev + 1) % totalSlides
      scrollToIdx(n)
      return n
    })
  }, [totalSlides, scrollToIdx])

  const prev = useCallback(() => {
    setActiveIdx((prev) => {
      const n = (prev - 1 + totalSlides) % totalSlides
      scrollToIdx(n)
      return n
    })
  }, [totalSlides, scrollToIdx])

  // Auto-scroll every 4s
  useEffect(() => {
    autoplayRef.current = setInterval(next, 4000)
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current) }
  }, [next])

  // Pause autoplay on hover
  const pauseAutoplay = () => { if (autoplayRef.current) clearInterval(autoplayRef.current) }
  const resumeAutoplay = () => { autoplayRef.current = setInterval(next, 4000) }

  // Update activeIdx on manual scroll
  const handleScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const card = el.children[0] as HTMLElement | undefined
    if (!card) return
    const gap = 20
    const cardW = card.offsetWidth + gap
    const idx = Math.round(el.scrollLeft / cardW)
    setActiveIdx(Math.min(idx, totalSlides - 1))
  }

  return (
    <section className="bg-background py-20 overflow-hidden">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <span className="pill-accent mb-4 inline-block">Destacados</span>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Restaurantes y cafeter&iacute;as <span className="text-accent">populares</span>
            </h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => { pauseAutoplay(); prev(); resumeAutoplay() }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-background-elevated text-foreground-subtle transition-colors hover:border-accent/40 hover:text-accent"
              aria-label="Anterior"
            >
              &#8592;
            </button>
            <button
              onClick={() => { pauseAutoplay(); next(); resumeAutoplay() }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-background-elevated text-foreground-subtle transition-colors hover:border-accent/40 hover:text-accent"
              aria-label="Siguiente"
            >
              &#8594;
            </button>
          </div>
        </div>

        {/* Carousel track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseEnter={pauseAutoplay}
          onMouseLeave={resumeAutoplay}
          className="flex gap-5 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {FEATURED_RESTAURANTS.map((r) => (
            <a
              key={r.name}
              href={r.slug}
              className="card group flex w-[300px] shrink-0 flex-col overflow-hidden p-0 snap-start md:w-[340px]"
            >
              {/* Image area with gradient */}
              <div className="relative flex h-48 w-full items-center justify-center bg-background-soft">
                <span className="text-8xl transition-transform duration-300 group-hover:scale-110">
                  {r.emoji}
                </span>
                {/* Price badge */}
                <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-accent">
                  {r.priceRange}
                </span>
                {/* Highlight badge */}
                <span className="absolute bottom-3 left-3 rounded-full bg-accent/90 px-3 py-1 text-[10px] font-bold text-white shadow-lg">
                  {r.highlight}
                </span>
              </div>

              {/* Card body */}
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-foreground">{r.name}</h3>
                  <span className="pill shrink-0 text-[10px]">{r.cuisine}</span>
                </div>

                {/* Rating */}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-sm tracking-wide text-accent">
                    {'★'.repeat(Math.floor(r.rating))}
                    <span className="text-foreground-subtle/30">{'★'.repeat(5 - Math.floor(r.rating))}</span>
                  </span>
                  <span className="text-xs font-semibold text-foreground">{r.rating}</span>
                  <span className="text-xs text-foreground-subtle">({r.reviews})</span>
                </div>

                {/* Tags */}
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {r.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-foreground-subtle">
                      {tag}
                    </span>
                  ))}
                  <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 text-[10px] text-foreground-subtle">
                    &#128205; {r.city}
                  </span>
                </div>

                {/* CTA */}
                <div className="mt-auto">
                  <span className="btn-primary inline-flex w-full justify-center py-2.5 text-xs">
                    Reservar mesa &rarr;
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Dots indicator */}
        <div className="mt-6 flex items-center justify-center gap-2">
          {FEATURED_RESTAURANTS.map((_, i) => (
            <button
              key={i}
              onClick={() => { pauseAutoplay(); scrollToIdx(i); resumeAutoplay() }}
              className={clsx(
                'h-2 rounded-full transition-all duration-300',
                activeIdx === i
                  ? 'w-6 bg-accent'
                  : 'w-2 bg-white/[0.15] hover:bg-white/[0.3]'
              )}
              aria-label={`Ir a slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center">
          <a href="/app" className="btn-secondary text-sm">
            Ver todos los restaurantes &rarr;
          </a>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background">

      {/* ════════════════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-background pb-28 pt-24">
        {/* Warm orange radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-[0.18]"
          style={{
            background: 'radial-gradient(ellipse 60% 55% at 50% 0%, #F97316 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          {/* Pre-alpha pill */}
          <span className="pill mb-8 inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Pre-alpha &middot; Delicioso by DineFirst
          </span>

          {/* Headline */}
          <h1 className="mx-auto mb-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl !leading-[1.1]">
            La plataforma que{' '}
            <span className="text-accent">transforma</span>{' '}
            tu restaurante
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-12 max-w-2xl text-base text-foreground-subtle md:text-lg md:leading-relaxed">
            Reservas en tiempo real, onboarding en 24 horas y un panel operativo
            con anal&iacute;ticas de comportamiento. Todo en un solo lugar, sin comisiones.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="/register" className="btn-primary px-10 py-3.5 text-base">
              Empezar gratis
            </a>
            <a href="/restaurantes/madrid/la-taberna-del-chef" className="btn-secondary px-10 py-3.5 text-base">
              Ver demo restaurante
            </a>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          STATS — Grande y prominente, estilo Delicioso
      ════════════════════════════════════════════════════════════════ */}
      <section className="border-b border-white/[0.06] bg-background-soft py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-4xl font-extrabold text-accent md:text-5xl">{s.value}</p>
                <p className="mt-2 text-sm font-medium text-foreground-subtle">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          CAROUSEL — Restaurantes y cafeterías destacados
      ════════════════════════════════════════════════════════════════ */}
      <FeaturedCarousel />

      {/* ════════════════════════════════════════════════════════════════
          PROBLEM / SOLUTION
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-background-soft py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">Problema &rarr; Soluci&oacute;n</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Tres problemas. <span className="text-accent">Una soluci&oacute;n.</span>
            </h2>
            <p className="mx-auto max-w-lg text-foreground-subtle">
              &iquest;Reconoces alguno de estos escenarios?
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                who: 'Para el comensal',
                problem: 'Reserva lenta y dispersa en m\u00FAltiples apps',
                solution: 'Reserva en tiempo real con confirmaci\u00F3n autom\u00E1tica v\u00EDa WhatsApp',
                icon: '\uD83C\uDF7D\uFE0F',
              },
              {
                who: 'Restaurante nuevo',
                problem: 'Invisibilidad digital en los primeros meses',
                solution: 'Alta operativa en 24-48h con visibilidad inmediata',
                icon: '\uD83C\uDF1F',
              },
              {
                who: 'Restaurante existente',
                problem: 'Dashboard fragmentado, an\u00E1lisis manual',
                solution: 'Panel centralizado con anal\u00EDticas de comportamiento y ROI',
                icon: '\uD83D\uDCC8',
              },
            ].map((item) => (
              <div key={item.who} className="card group">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl">
                    {item.icon}
                  </div>
                  <span className="pill text-xs">{item.who}</span>
                </div>
                <div className="mb-3 flex items-start gap-2">
                  <span className="mt-0.5 text-sm text-danger">&#10060;</span>
                  <p className="text-sm font-medium text-foreground-subtle">{item.problem}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm text-success">&#9989;</span>
                  <p className="text-sm font-medium text-success">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FEATURES
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">Funcionalidades</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Todo lo que necesita tu restaurante
            </h2>
            <p className="mx-auto max-w-lg text-foreground-subtle">
              Dise&ntilde;ado para simplificar la operativa, no para a&ntilde;adir complejidad.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="card group hover:border-accent/30 transition-all hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl transition-colors group-hover:bg-accent/20">
                  {f.icon}
                </div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-foreground-subtle">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-background-soft py-24" id="pricing">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">Planes</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Precios claros, <span className="text-accent">sin sorpresas</span>
            </h2>
            <p className="mx-auto max-w-lg text-foreground-subtle">
              Sin comisiones por reserva. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={clsx(
                  'card relative flex flex-col',
                  plan.highlighted
                    ? 'border-accent/50 shadow-[0_0_40px_rgba(249,115,22,0.15)] scale-[1.02]'
                    : ''
                )}
              >
                {/* Popular badge */}
                {plan.highlighted && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-accent px-5 py-1 text-xs font-bold text-white shadow-[0_4px_12px_rgba(249,115,22,0.4)]">
                    M&aacute;s popular
                  </span>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-accent">
                    {plan.name}
                  </p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-5xl font-extrabold text-foreground">{plan.price}&euro;</span>
                    <span className="mb-1.5 text-sm text-foreground-subtle">/mes</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground-subtle">{plan.description}</p>
                </div>

                {/* Divider */}
                <div className="divider !my-0 mb-6" />

                {/* Features list */}
                <ul className="mb-8 mt-6 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm text-foreground">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10 text-success text-xs">
                        &#10003;
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a
                  href="/register"
                  className={clsx(
                    'block w-full rounded-full py-3 text-center text-sm font-semibold transition-all duration-200',
                    plan.highlighted
                      ? 'bg-accent text-white hover:bg-accent-strong shadow-[0_4px_16px_rgba(249,115,22,0.3)]'
                      : 'border border-white/[0.1] bg-background-elevated text-foreground hover:border-accent/40 hover:text-accent'
                  )}
                >
                  Empezar con {plan.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">Testimonios</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Lo que dicen los restaurantes
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card relative">
                {/* Decorative quote */}
                <span
                  aria-hidden="true"
                  className="absolute -top-2 left-5 text-6xl font-serif leading-none text-accent/15 select-none"
                >
                  &ldquo;
                </span>

                <div className="relative pt-4">
                  <p className="mb-6 text-sm leading-relaxed text-foreground">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-foreground-subtle">{t.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FAQ
      ════════════════════════════════════════════════════════════════ */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-2xl px-6">
          <div className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">FAQ</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Preguntas frecuentes
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="card cursor-pointer select-none"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-foreground">{faq.q}</p>
                  <span
                    className={clsx(
                      'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs text-accent transition-transform duration-300',
                      openFaq === i && 'rotate-180'
                    )}
                  >
                    &#9660;
                  </span>
                </div>
                <div
                  className={clsx(
                    'grid transition-all duration-300 ease-in-out',
                    openFaq === i ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="text-sm leading-relaxed text-foreground-subtle">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-background-soft py-28">
        {/* Subtle bottom glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 bottom-0 -translate-x-1/2 w-[700px] h-[400px] rounded-full opacity-[0.12]"
          style={{
            background: 'radial-gradient(ellipse 60% 55% at 50% 100%, #F97316 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-5 text-3xl font-bold text-foreground md:text-4xl">
            &iquest;Listo para gestionar tu restaurante{' '}
            <span className="text-accent">de forma inteligente</span>?
          </h2>
          <p className="mb-10 text-foreground-subtle">
            Empieza hoy. Sin contrato, sin comisiones, sin sorpresas.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a href="/register" className="btn-primary px-12 py-3.5 text-base">
              Crear cuenta gratis
            </a>
            <a href="/login" className="btn-secondary px-12 py-3.5 text-base">
              Ya tengo cuenta
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
