'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import clsx from 'clsx'

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  delay?: number
  /** Si true, solo anima la primera vez que entra en vista */
  once?: boolean
}

export function AnimatedCard({
  children,
  className,
  delay = 0,
  once = true,
}: AnimatedCardProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: '-40px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className={clsx('card', className)}
    >
      {children}
    </motion.div>
  )
}

/**
 * Card sin efecto hover (para dashboards, formularios, etc.)
 */
export function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
