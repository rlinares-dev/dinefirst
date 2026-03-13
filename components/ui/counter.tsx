'use client'

import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate, useInView } from 'framer-motion'

interface AnimatedCounterProps {
  /** Valor final del contador */
  value: number
  /** Duración de la animación en segundos */
  duration?: number
  /** Número de decimales a mostrar */
  decimals?: number
  /** Prefijo (ej: "€", "$") */
  prefix?: string
  /** Sufijo (ej: "%", "k") */
  suffix?: string
  /** Clase CSS adicional */
  className?: string
}

export function AnimatedCounter({
  value,
  duration = 1.5,
  decimals = 0,
  prefix = '',
  suffix = '',
  className,
}: AnimatedCounterProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (latest) =>
    `${prefix}${latest.toFixed(decimals)}${suffix}`
  )

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionValue, value, {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
      })
      return () => controls.stop()
    }
  }, [isInView, motionValue, value, duration])

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  )
}
