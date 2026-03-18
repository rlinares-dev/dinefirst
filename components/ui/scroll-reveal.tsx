'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'

/* ─── ScrollReveal ─────────────────────────────────────────────────
   Generic scroll-triggered reveal with configurable direction.
   Uses GPU-accelerated transforms only (no layout thrashing).
──────────────────────────────────────────────────────────────────── */

type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  direction?: Direction
  delay?: number
  duration?: number
  distance?: number
  once?: boolean
  blur?: boolean
}

const getInitial = (direction: Direction, distance: number, blur: boolean) => {
  const base: Record<string, number | string> = { opacity: 0 }
  if (blur) base.filter = 'blur(6px)'

  switch (direction) {
    case 'up':    return { ...base, y: distance }
    case 'down':  return { ...base, y: -distance }
    case 'left':  return { ...base, x: distance }
    case 'right': return { ...base, x: -distance }
    case 'none':  return base
  }
}

const getAnimate = (blur: boolean) => {
  const base: Record<string, number | string> = { opacity: 1, x: 0, y: 0 }
  if (blur) base.filter = 'blur(0px)'
  return base
}

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 0.5,
  distance = 24,
  once = true,
  blur = false,
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      initial={getInitial(direction, distance, blur)}
      animate={isInView ? getAnimate(blur) : getInitial(direction, distance, blur)}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ─── ParallaxSection ──────────────────────────────────────────────
   Subtle parallax offset driven by scroll progress.
   Uses useTransform for buttery-smooth GPU-only animation.
──────────────────────────────────────────────────────────────────── */

interface ParallaxProps {
  children: React.ReactNode
  className?: string
  speed?: number
}

export function ParallaxSection({ children, className, speed = 0.15 }: ParallaxProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], [speed * -60, speed * 60])

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  )
}

/* ─── TextReveal ───────────────────────────────────────────────────
   Word-by-word text reveal on scroll.
──────────────────────────────────────────────────────────────────── */

interface TextRevealProps {
  text: string
  className?: string
  stagger?: number
}

export function TextReveal({
  text,
  className,
  stagger = 0.04,
}: TextRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const words = text.split(' ')

  return (
    <span ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
          animate={isInView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{
            duration: 0.35,
            delay: i * stagger,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
        >
          {word}{i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  )
}

/* ─── CountUp ──────────────────────────────────────────────────────
   Animated number counter that triggers on scroll with rAF.
──────────────────────────────────────────────────────────────────── */

interface CountUpProps {
  end: number
  suffix?: string
  prefix?: string
  duration?: number
  className?: string
}

export function CountUp({ end, suffix = '', prefix = '', duration = 1.8, className }: CountUpProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })
  const [display, setDisplay] = useState(`${prefix}0${suffix}`)

  useEffect(() => {
    if (!isInView) return

    let startTime: number | null = null
    let raf: number

    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / (duration * 1000), 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.floor(eased * end)
      setDisplay(`${prefix}${current}${suffix}`)

      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      } else {
        setDisplay(`${prefix}${end}${suffix}`)
      }
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [isInView, end, duration, prefix, suffix])

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {display}
    </motion.span>
  )
}
