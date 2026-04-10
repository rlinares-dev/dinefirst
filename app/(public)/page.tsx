'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import clsx from 'clsx'
import { ScrollReveal, TextReveal, CountUp } from '@/components/ui/scroll-reveal'
import { StaggeredGrid } from '@/components/ui/staggered-list'
import { getRestaurants } from '@/lib/data'
import type { Restaurant } from '@/types/database'

// Fallbacks para restaurantes sin imagen subida (por cocina)
const CUISINE_EMOJI: Record<string, string> = {
  española: '🥘',
  catalana: '🍳',
  japonesa: '🍱',
  italiana: '🍕',
  mediterránea: '🦐',
  mexicana: '🌮',
  francesa: '🥐',
  china: '🥟',
  cafetería: '☕',
}
const cuisineEmoji = (cuisine: string) => {
  const key = Object.keys(CUISINE_EMOJI).find((k) => cuisine.toLowerCase().includes(k))
  return key ? CUISINE_EMOJI[key] : '🍽️'
}

// Tags decorativos según plan (visual only)
const TAGS_BY_PLAN: Record<string, string[]> = {
  basic: ['Tradicional'],
  pro: ['De autor', 'Recomendado'],
  premium: ['Premium', 'Experiencia'],
}

// Rango de precio aproximado según plan
const PRICE_BY_PLAN: Record<string, string> = {
  basic: '€',
  pro: '€€',
  premium: '€€€',
}

const FEATURES = [
  {
    icon: '⚡',
    title: 'Reservas en tiempo real',
    description:
      'Disponibilidad actualizada al instante. Sin llamadas, sin emails, sin esperas. Confirmación automática por WhatsApp y email.',
  },
  {
    icon: '🚀',
    title: 'Onboarding en 24 horas',
    description:
      'Tu restaurante visible en la plataforma en menos de un día. Sin contratos largos, sin comisiones por reserva.',
  },
  {
    icon: '📊',
    title: 'Dashboard operativo unificado',
    description:
      'Gestión de mesas, menú, reservas y analíticas en un solo lugar. Olvídate de las hojas de Excel.',
  },
  {
    icon: '💬',
    title: 'Notificaciones WhatsApp',
    description:
      'Confirmación, recordatorio 24h antes y alerta de no-show. Tus clientes siempre informados sin esfuerzo.',
  },
  {
    icon: '🔍',
    title: 'SEO propio',
    description:
      'Cada restaurante tiene su página indexada. Sin depender de ecosistemas ajenos ni pagar por visibilidad.',
  },
  {
    icon: '🛡️',
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
    features: ['Hasta 20 mesas', 'Reservas ilimitadas', 'Perfil público SEO', 'Email de confirmación', 'Soporte por email'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 99,
    description: 'El más popular para negocios activos',
    features: ['Mesas ilimitadas', 'Reservas ilimitadas', 'Perfil público SEO', 'WhatsApp + Email', 'Analíticas básicas', 'Soporte prioritario'],
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 199,
    description: 'Para cadenas y grupos de restauración',
    features: ['Multi-restaurante', 'Mesas ilimitadas', 'Analíticas avanzadas + IA', 'WhatsApp + Email + SMS', 'API acceso completo', 'Account manager dedicado'],
    highlighted: false,
  },
]

const TESTIMONIALS = [
  {
    name: 'Carlos Mendoza',
    role: 'Chef propietario · La Taberna del Chef',
    text: 'Pasamos de gestionar reservas en WhatsApp a tener todo automatizado en dos días. Las cancelaciones bajaron un 40%.',
  },
  {
    name: 'Lucía Ferrer',
    role: 'Gerente · Grupo Ferrer Hospitality',
    text: 'Con DineFirst consolidamos 5 restaurantes en un mismo dashboard. Ahorramos 12 horas a la semana en gestión operativa.',
  },
  {
    name: 'Ahmed Bouaziz',
    role: 'Director · Sake & Fusion',
    text: 'El onboarding fue increíblemente rápido. En 24 horas ya teníamos reservas entrando desde la web.',
  },
]

const STATS = [
  { value: 120, suffix: '+', label: 'Restaurantes' },
  { value: 50, suffix: 'k+', label: 'Reservas gestionadas' },
  { value: 9, suffix: '', label: 'Rating promedio', displayPrefix: '4.' },
  { value: 24, suffix: 'h', label: 'Tiempo de alta' },
]

const FAQS = [
  {
    q: '¿DineFirst cobra comisión por cada reserva?',
    a: 'No. DineFirst funciona con suscripción mensual plana. Nunca pagarás comisión por reserva, independientemente de cuántas gestiones hagas.',
  },
  {
    q: '¿Cuánto tiempo lleva el alta?',
    a: 'Menos de 24 horas. Rellena el formulario de onboarding, nosotros revisamos tu perfil y lo publicamos. Sin contratos de permanencia.',
  },
  {
    q: '¿Funciona para cadenas con varios restaurantes?',
    a: 'Sí, el plan Premium está diseñado para grupos de restauración. Gestiona múltiples locales desde un único panel.',
  },
  {
    q: '¿Puedo cancelar cuando quiera?',
    a: 'Sí. Cancelación sin penalización en cualquier momento desde el panel de facturación. Sin permanencias.',
  },
]

function FeaturedCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIdx, setActiveIdx] = useState(0)
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const autoplayRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Carga los restaurantes reales (mock o los que haya subido el usuario)
  useEffect(() => {
    const list = getRestaurants()
      .filter((r) => r.isActive)
      .sort((a, b) => b.rating - a.rating)
    setRestaurants(list)
  }, [])

  const totalSlides = restaurants.length

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

  useEffect(() => {
    autoplayRef.current = setInterval(next, 4000)
    return () => { if (autoplayRef.current) clearInterval(autoplayRef.current) }
  }, [next])

  const pauseAutoplay = () => { if (autoplayRef.current) clearInterval(autoplayRef.current) }
  const resumeAutoplay = () => { autoplayRef.current = setInterval(next, 4000) }

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
    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-6">
        <ScrollReveal direction="up" className="mb-10 flex items-end justify-between">
          <div>
            <span className="pill-accent mb-4 inline-block">Destacados</span>
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Restaurantes y cafeterías <span className="text-gradient">populares</span>
            </h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => { pauseAutoplay(); prev(); resumeAutoplay() }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-background-elevated text-foreground-subtle transition-colors hover:border-accent/40 hover:text-accent"
              aria-label="Anterior"
            >
              ←
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => { pauseAutoplay(); next(); resumeAutoplay() }}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.1] bg-background-elevated text-foreground-subtle transition-colors hover:border-accent/40 hover:text-accent"
              aria-label="Siguiente"
            >
              →
            </motion.button>
          </div>
        </ScrollReveal>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseEnter={pauseAutoplay}
          onMouseLeave={resumeAutoplay}
          className="flex gap-5 overflow-x-auto scroll-smooth px-1 pt-4 pb-6 snap-x snap-mandatory scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {restaurants.map((r) => {
            const tags = TAGS_BY_PLAN[r.plan] || []
            const priceRange = PRICE_BY_PLAN[r.plan] || '€€'
            const coverImage = r.images?.[0]
            const cityLabel = r.city.charAt(0).toUpperCase() + r.city.slice(1)
            return (
              <motion.a
                key={r.id}
                href={`/restaurantes/${r.city}/${r.slug}`}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="group flex w-[300px] shrink-0 flex-col rounded-2xl border border-white/[0.08] bg-[#1a1a1a] shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_16px_40px_-12px_rgba(249,115,22,0.35)] snap-start md:w-[340px]"
              >
                {/* Imagen real del restaurante con fallback a emoji */}
                <div className="relative h-44 w-full overflow-hidden rounded-t-2xl">
                  {coverImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverImage}
                        alt={r.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                        loading="lazy"
                      />
                      {/* Gradiente oscuro en la base para legibilidad del ribbon */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />
                    </>
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{
                        background:
                          'radial-gradient(ellipse at center, rgba(249,115,22,0.18) 0%, #0f0f0f 70%)',
                      }}
                    >
                      <motion.span
                        className="text-7xl drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                        whileHover={{ scale: 1.12, rotate: 4 }}
                        transition={{ type: 'spring', stiffness: 250, damping: 15 }}
                      >
                        {cuisineEmoji(r.cuisineType)}
                      </motion.span>
                    </div>
                  )}

                  {/* Price range chip */}
                  <span className="absolute top-3 right-3 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[11px] font-bold text-accent backdrop-blur-sm">
                    {priceRange}
                  </span>

                  {/* City chip */}
                  <span className="absolute top-3 left-3 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur-sm">
                    📍 {cityLabel}
                  </span>

                  {/* Highlight ribbon */}
                  <span className="absolute bottom-3 left-3 right-3 truncate rounded-full bg-gradient-to-r from-accent to-accent-strong px-3 py-1.5 text-center text-[11px] font-bold text-white shadow-[0_4px_12px_rgba(249,115,22,0.4)]">
                    ★ {r.rating.toFixed(1)} · {r.cuisineType}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold leading-tight text-foreground">
                      {r.name}
                    </h3>
                    <span className="shrink-0 rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                      {r.plan}
                    </span>
                  </div>

                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-white/[0.04] px-2.5 py-1">
                      <span className="text-sm text-accent">★</span>
                      <span className="text-xs font-bold text-foreground">
                        {r.rating.toFixed(1)}
                      </span>
                    </div>
                    <span className="text-xs text-foreground-subtle">
                      {r.reviewCount} reseñas
                    </span>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-foreground-subtle"
                      >
                        {tag}
                      </span>
                    ))}
                    <span className="rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[10px] text-foreground-subtle">
                      {r.capacity} plazas
                    </span>
                  </div>

                  <div className="mt-auto">
                    <span className="flex w-full items-center justify-center gap-1.5 rounded-full bg-accent py-2.5 text-xs font-semibold text-white transition-all duration-300 group-hover:bg-accent-strong group-hover:shadow-[0_8px_20px_-4px_rgba(249,115,22,0.5)]">
                      Reservar mesa
                      <span className="transition-transform duration-300 group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                  </div>
                </div>
              </motion.a>
            )
          })}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2">
          {restaurants.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => { pauseAutoplay(); scrollToIdx(i); resumeAutoplay() }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
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

        <div className="mt-8 text-center">
          <a href="/app" className="btn-secondary text-sm">
            Ver todos los restaurantes →
          </a>
        </div>
      </div>
    </section>
  )
}

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])
  const heroScale = useTransform(scrollYProgress, [0, 0.7], [1, 0.97])

  return (
    <div className="min-h-screen bg-background">

      {/* ═══════════════ HERO ═══════════════ */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative overflow-hidden bg-background pb-28 pt-24"
      >
        {/* Animated orange glow */}
        <motion.div
          aria-hidden="true"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.45, 0.6, 0.45],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/2 top-0 w-[1100px] h-[700px] rounded-full"
          style={{
            x: '-50%',
            background: 'radial-gradient(ellipse 60% 55% at 50% 0%, #F97316 0%, transparent 70%)',
          }}
        />

        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <motion.span
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="pill mb-8 inline-flex items-center gap-2"
          >
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Pre-alpha · Delicioso by DineFirst
          </motion.span>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1, delay: 0.2 }}
            className="mx-auto mb-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl !leading-[1.1]"
          >
            <TextReveal text="La plataforma que" stagger={0.05} />{' '}
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="text-gradient inline-block"
            >
              transforma
            </motion.span>{' '}
            <TextReveal text="tu restaurante" stagger={0.05} />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mx-auto mb-12 max-w-2xl text-base text-foreground-subtle md:text-lg md:leading-relaxed"
          >
            Reservas en tiempo real, onboarding en 24 horas y un panel operativo
            con analíticas de comportamiento. Todo en un solo lugar, sin comisiones.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
          >
            <motion.a
              href="/register"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary px-10 py-3.5 text-base shadow-glow-sm hover:shadow-glow-md transition-shadow duration-300"
            >
              Empezar gratis
            </motion.a>
            <motion.a
              href="/restaurantes/madrid/la-taberna-del-chef"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-secondary px-10 py-3.5 text-base"
            >
              Ver demo restaurante
            </motion.a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.5 }}
            className="mt-16 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-8 w-5 items-start justify-center rounded-full border border-white/[0.15] p-1"
            >
              <motion.div className="h-1.5 w-1 rounded-full bg-accent" />
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* ═══════════════ STATS ═══════════════ */}
      <section className="border-b border-white/[0.06] bg-background-soft py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {STATS.map((s, i) => (
              <ScrollReveal key={s.label} direction="up" delay={i * 0.1} className="text-center">
                <p className="text-4xl font-extrabold text-accent md:text-5xl">
                  {s.displayPrefix && <span>{s.displayPrefix}</span>}
                  <CountUp end={s.value} suffix={s.suffix} duration={1.8} className="inline" />
                </p>
                <p className="mt-2 text-sm font-medium text-foreground-subtle">{s.label}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ CAROUSEL ═══════════════ */}
      <FeaturedCarousel />

      {/* ═══════════════ PROBLEM / SOLUTION ═══════════════ */}
      <section className="bg-background-soft py-24">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal direction="up" className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">Problema → Solución</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Tres problemas. <span className="text-gradient">Una solución.</span>
            </h2>
            <p className="mx-auto max-w-lg text-foreground-subtle">
              ¿Reconoces alguno de estos escenarios?
            </p>
          </ScrollReveal>

          <StaggeredGrid className="grid gap-6 md:grid-cols-3">
            {[
              {
                who: 'Para el comensal',
                problem: 'Reserva lenta y dispersa en múltiples apps',
                solution: 'Reserva en tiempo real con confirmación automática vía WhatsApp',
                icon: '🍽️',
              },
              {
                who: 'Restaurante nuevo',
                problem: 'Invisibilidad digital en los primeros meses',
                solution: 'Alta operativa en 24-48h con visibilidad inmediata',
                icon: '🌟',
              },
              {
                who: 'Restaurante existente',
                problem: 'Dashboard fragmentado, análisis manual',
                solution: 'Panel centralizado con analíticas de comportamiento y ROI',
                icon: '📈',
              },
            ].map((item) => (
              <motion.div
                key={item.who}
                whileHover={{ y: -4, borderColor: 'rgba(249,115,22,0.25)' }}
                className="card card-shine group"
              >
                <div className="mb-4 flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl"
                  >
                    {item.icon}
                  </motion.div>
                  <span className="pill text-xs">{item.who}</span>
                </div>
                <div className="mb-3 flex items-start gap-2">
                  <span className="mt-0.5 text-sm text-danger">❌</span>
                  <p className="text-sm font-medium text-foreground-subtle">{item.problem}</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 text-sm text-success">✅</span>
                  <p className="text-sm font-medium text-success">{item.solution}</p>
                </div>
              </motion.div>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      {/* ═══════════════ FEATURES ═══════════════ */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal direction="up" className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">Funcionalidades</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Todo lo que necesita tu restaurante
            </h2>
            <p className="mx-auto max-w-lg text-foreground-subtle">
              Diseñado para simplificar la operativa, no para añadir complejidad.
            </p>
          </ScrollReveal>

          <StaggeredGrid className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                whileHover={{ y: -4 }}
                className="card card-shine group hover:border-accent/30 transition-all hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)]"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -3 }}
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-2xl transition-colors group-hover:bg-accent/20"
                >
                  {f.icon}
                </motion.div>
                <h3 className="mb-2 text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-foreground-subtle">{f.description}</p>
              </motion.div>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section className="bg-background-soft py-24" id="pricing">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal direction="up" className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">Planes</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Precios claros, <span className="text-gradient">sin sorpresas</span>
            </h2>
            <p className="mx-auto max-w-lg text-foreground-subtle">
              Sin comisiones por reserva. Cancela cuando quieras.
            </p>
          </ScrollReveal>

          <div className="grid gap-6 pt-8 md:grid-cols-3 items-center">
            {PLANS.map((plan, i) => {
              const highlightScale = plan.highlighted && isDesktop ? 1.06 : 1
              return (
              <ScrollReveal key={plan.id} direction="up" delay={i * 0.12} className="h-full">
                <motion.div
                  animate={{ scale: highlightScale }}
                  whileHover={{ y: -6, scale: highlightScale }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className={clsx(
                    'relative flex h-full flex-col rounded-2xl border shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-[border-color,box-shadow] duration-300',
                    plan.highlighted
                      ? 'border-accent/60 bg-gradient-to-b from-[#1f1410] to-[#1a1a1a] p-7 md:py-9 shadow-[0_0_60px_-15px_rgba(249,115,22,0.35)] z-10'
                      : 'border-white/[0.08] bg-[#1a1a1a] p-6 hover:border-white/[0.16]'
                  )}
                >
                  {plan.highlighted && (
                    <>
                      {/* Badge flotante — ahora visible porque no hay overflow:hidden */}
                      <motion.span
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, type: 'spring', stiffness: 300 }}
                        className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-accent to-accent-strong px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-[0_6px_20px_-4px_rgba(249,115,22,0.6)]"
                      >
                        ★ Más popular
                      </motion.span>
                      {/* Glow interior decorativo */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 rounded-2xl opacity-60"
                        style={{
                          background:
                            'radial-gradient(ellipse 80% 40% at 50% 0%, rgba(249,115,22,0.18) 0%, transparent 70%)',
                        }}
                      />
                    </>
                  )}

                  <div className="relative mb-6">
                    <p
                      className={clsx(
                        'text-[11px] font-bold uppercase tracking-[0.2em]',
                        plan.highlighted ? 'text-accent' : 'text-foreground-subtle'
                      )}
                    >
                      {plan.name}
                    </p>
                    <div className="mt-3 flex items-end gap-1">
                      <span className="text-5xl font-extrabold leading-none text-foreground">
                        {plan.price}€
                      </span>
                      <span className="mb-1 text-sm text-foreground-subtle">/mes</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground-subtle">
                      {plan.description}
                    </p>
                  </div>

                  <div className="relative mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                  <ul className="relative mb-8 flex-1 space-y-3">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-3 text-sm leading-relaxed text-foreground"
                      >
                        <span
                          className={clsx(
                            'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                            plan.highlighted
                              ? 'bg-accent text-white'
                              : 'bg-success/10 text-success'
                          )}
                        >
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <motion.a
                    href="/register"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={clsx(
                      'relative block w-full rounded-full py-3 text-center text-sm font-semibold transition-all duration-200',
                      plan.highlighted
                        ? 'bg-accent text-white hover:bg-accent-strong shadow-[0_8px_24px_-6px_rgba(249,115,22,0.5)]'
                        : 'border border-white/[0.1] bg-background-elevated text-foreground hover:border-accent/40 hover:text-accent'
                    )}
                  >
                    Empezar con {plan.name}
                  </motion.a>
                </motion.div>
              </ScrollReveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-5xl px-6">
          <ScrollReveal direction="up" className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">Testimonios</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Lo que dicen los restaurantes
            </h2>
          </ScrollReveal>

          <StaggeredGrid className="grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <motion.div
                key={t.name}
                whileHover={{ y: -4 }}
                className="card card-shine relative"
              >
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
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent"
                    >
                      {t.name.charAt(0)}
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      <p className="text-xs text-foreground-subtle">{t.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </StaggeredGrid>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-2xl px-6">
          <ScrollReveal direction="up" className="mb-16 text-center">
            <span className="pill-accent mb-4 inline-block">FAQ</span>
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
              Preguntas frecuentes
            </h2>
          </ScrollReveal>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 0.06}>
                <motion.div
                  whileHover={{ borderColor: 'rgba(249,115,22,0.2)' }}
                  className="card cursor-pointer select-none"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">{faq.q}</p>
                    <motion.span
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs text-accent"
                    >
                      ▼
                    </motion.span>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{
                      height: openFaq === i ? 'auto' : 0,
                      opacity: openFaq === i ? 1 : 0,
                      marginTop: openFaq === i ? 12 : 0,
                    }}
                    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm leading-relaxed text-foreground-subtle">{faq.a}</p>
                  </motion.div>
                </motion.div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative overflow-hidden bg-background-soft py-28">
        <motion.div
          aria-hidden="true"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.55, 0.4],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute left-1/2 bottom-0 w-[1100px] h-[600px] rounded-full"
          style={{
            x: '-50%',
            background: 'radial-gradient(ellipse 60% 55% at 50% 100%, #F97316 0%, transparent 70%)',
          }}
        />

        <ScrollReveal direction="up" className="relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="mb-5 text-3xl font-bold text-foreground md:text-4xl">
            ¿Listo para gestionar tu restaurante{' '}
            <span className="text-gradient">de forma inteligente</span>?
          </h2>
          <p className="mb-10 text-foreground-subtle">
            Empieza hoy. Sin contrato, sin comisiones, sin sorpresas.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <motion.a
              href="/register"
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary px-12 py-3.5 text-base shadow-glow-sm hover:shadow-glow-md transition-shadow duration-300"
            >
              Crear cuenta gratis
            </motion.a>
            <motion.a
              href="/login"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-secondary px-12 py-3.5 text-base"
            >
              Ya tengo cuenta
            </motion.a>
          </div>
        </ScrollReveal>
      </section>
    </div>
  )
}
