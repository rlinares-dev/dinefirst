'use client'

import { motion } from 'framer-motion'
import clsx from 'clsx'

interface MotionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: React.ReactNode
}

/**
 * Botón con micro-interacciones Framer Motion.
 * Tap → scale down, Hover → scale up sutil.
 */
export function MotionButton({
  variant = 'primary',
  className,
  children,
  ...props
}: MotionButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={clsx(
        {
          'btn-primary': variant === 'primary',
          'btn-secondary': variant === 'secondary',
          'btn-ghost': variant === 'ghost',
        },
        className
      )}
      {...(props as React.ComponentProps<typeof motion.button>)}
    >
      {children}
    </motion.button>
  )
}
