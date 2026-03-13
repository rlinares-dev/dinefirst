'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
}

interface StaggeredListProps {
  children: React.ReactNode[]
  className?: string
  /** Delay entre items en segundos (default: 0.06) */
  staggerDelay?: number
}

export function StaggeredList({
  children,
  className,
  staggerDelay,
}: StaggeredListProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-20px' })

  const variants = staggerDelay
    ? {
        ...containerVariants,
        visible: {
          ...containerVariants.visible,
          transition: {
            ...containerVariants.visible.transition,
            staggerChildren: staggerDelay,
          },
        },
      }
    : containerVariants

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}

/**
 * Grid con stagger — los items entran uno a uno.
 */
export function StaggeredGrid({
  children,
  className,
}: {
  children: React.ReactNode[]
  className?: string
}) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-30px' })

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {children.map((child, i) => (
        <motion.div key={i} variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  )
}
