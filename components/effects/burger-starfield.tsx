'use client'

import { useEffect, useState } from 'react'

interface Star {
  x: number
  y: number
  size: number
  delay: number
  duration: number
  opacity: number
}

interface Burger {
  id: number
  top: number
  left: number
  delay: number
  duration: number
  size: number
  tailColor: string
}

const NUM_STARS = 120
const NUM_BURGERS = 10

function randomBurgerColor() {
  const colors = ['#F97316', '#FDBA74', '#FFEDD5', '#FFD580']
  return colors[Math.floor(Math.random() * colors.length)]
}

export function BurgerStarfield() {
  const [stars, setStars] = useState<Star[]>([])
  const [burgers, setBurgers] = useState<Burger[]>([])

  useEffect(() => {
    const s: Star[] = Array.from({ length: NUM_STARS }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.4,
      delay: Math.random() * 5,
      duration: Math.random() * 3 + 2,
      opacity: Math.random() * 0.5 + 0.3,
    }))
    setStars(s)

    const b: Burger[] = Array.from({ length: NUM_BURGERS }, (_, i) => ({
      id: i,
      top: Math.random() * 50, // start in top half
      left: Math.random() * 40 + 30, // start 30-70% horizontally
      delay: i * 2.2 + Math.random() * 4,
      duration: Math.random() * 2 + 3.5,
      size: Math.random() * 8 + 16,
      tailColor: randomBurgerColor(),
    }))
    setBurgers(b)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a0614] via-[#0d0816] to-[#04030a]" />

      {/* Radial orange glow in center — very subtle */}
      <div className="absolute top-1/2 left-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.06] blur-[160px]" />

      {/* Static twinkling stars */}
      {stars.map((s, i) => (
        <span
          key={`star-${i}`}
          className="absolute rounded-full bg-white twinkle-star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.opacity,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}

      {/* Shooting burgers 🍔 */}
      {burgers.map((b) => (
        <div
          key={`burger-${b.id}`}
          className="shooting-burger absolute"
          style={{
            top: `${b.top}%`,
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            // @ts-expect-error CSS custom property
            '--tail-color': b.tailColor,
            '--burger-size': `${b.size}px`,
          }}
        >
          <span className="burger-tail" />
          <span className="burger-emoji">🍔</span>
        </div>
      ))}

      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.1;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        .twinkle-star {
          animation: twinkle ease-in-out infinite;
          box-shadow: 0 0 4px rgba(255, 255, 255, 0.8);
        }

        @keyframes burger-shoot {
          0% {
            transform: translate3d(0, 0, 0) rotate(-45deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            transform: translate3d(-140vw, 140vh, 0) rotate(-45deg);
            opacity: 0;
          }
        }

        .shooting-burger {
          display: flex;
          align-items: center;
          animation: burger-shoot linear infinite;
          filter: drop-shadow(0 0 6px var(--tail-color));
        }

        .burger-tail {
          display: block;
          width: 140px;
          height: 2px;
          background: linear-gradient(
            90deg,
            transparent,
            var(--tail-color) 40%,
            var(--tail-color)
          );
          border-radius: 999px;
          filter: blur(0.6px);
          box-shadow: 0 0 10px var(--tail-color);
          margin-right: -6px;
        }

        .burger-emoji {
          font-size: var(--burger-size);
          line-height: 1;
          display: inline-block;
          filter: drop-shadow(0 0 10px var(--tail-color));
          transform: rotate(45deg); /* compensate parent rotation so burger is upright */
        }
      `}</style>
    </div>
  )
}
