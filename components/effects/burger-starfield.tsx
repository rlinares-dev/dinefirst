'use client'

import { useEffect, useState, CSSProperties } from 'react'

interface Shooter {
  id: number
  top: string
  left: string
  delay: string
  duration: string
}

const NUM_SHOOTERS = 20

// Genera delays/duraciones aleatorias
function generateShooters(): Shooter[] {
  return Array.from({ length: NUM_SHOOTERS }, (_, i) => ({
    id: i,
    top: `${Math.floor(Math.random() * 55) + 5}%`,
    left: `${Math.floor(Math.random() * 45) + 50}%`,
    delay: `${(Math.random() * 9 + i * 0.25).toFixed(2)}s`,
    duration: `${(Math.random() * 1.8 + 2.5).toFixed(2)}s`,
  }))
}

export function BurgerStarfield() {
  const [shooters, setShooters] = useState<Shooter[]>([])

  useEffect(() => {
    setShooters(generateShooters())
  }, [])

  return (
    <div className="burger-stars pointer-events-none absolute inset-0 overflow-hidden">
      {/* Rotated container — hace que todos los hijos se desplacen diagonalmente */}
      <div className="stars-inner">
        {shooters.map((s) => (
          <div
            key={s.id}
            className="shooting_star"
            style={
              {
                top: s.top,
                left: s.left,
                '--delay': s.delay,
                '--duration': s.duration,
              } as CSSProperties
            }
          >
            <span className="burger-head">🍔</span>
          </div>
        ))}
      </div>

      <style jsx>{`
        .burger-stars {
          /* Fondo degradado estilo codepen, con colores del proyecto */
          background: radial-gradient(ellipse at bottom, #1a0f08 0%, #050310 60%, #020108 100%);
        }

        .stars-inner {
          position: absolute;
          inset: 0;
          transform: rotateZ(-45deg);
        }

        /* Cada shooting star: una barra horizontal con gradiente (cola) */
        .shooting_star {
          position: absolute;
          height: 2px;
          background: linear-gradient(-45deg, #f97316, rgba(249, 115, 22, 0));
          border-radius: 999px;
          filter: drop-shadow(0 0 6px #fdba74);
          animation: tail var(--duration) ease-in-out infinite,
            shooting var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }

        /* Destello central al principio (como el codepen) */
        .shooting_star::before {
          content: '';
          position: absolute;
          top: calc(50% - 1px);
          right: 0;
          height: 2px;
          background: linear-gradient(
            -45deg,
            rgba(249, 115, 22, 0),
            #fdba74,
            rgba(249, 115, 22, 0)
          );
          transform: translateX(50%) rotateZ(45deg);
          border-radius: 100%;
          animation: shining var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }

        /* Brillo detrás */
        .shooting_star::after {
          content: '';
          position: absolute;
          top: calc(50% - 1px);
          right: 0;
          height: 2px;
          background: linear-gradient(
            -45deg,
            rgba(249, 115, 22, 0),
            #f97316,
            rgba(249, 115, 22, 0)
          );
          transform: translateX(50%) rotateZ(-45deg);
          border-radius: 100%;
          animation: shining var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }

        /* La hamburguesa va en la cabeza de la estrella fugaz */
        .burger-head {
          position: absolute;
          top: 50%;
          right: 0;
          font-size: 22px;
          line-height: 1;
          transform: translate(50%, -50%) rotate(45deg);
          filter: drop-shadow(0 0 8px #f97316);
          animation: burger-pop var(--duration) ease-in-out infinite;
          animation-delay: var(--delay);
        }

        @keyframes tail {
          0% {
            width: 0;
          }
          30% {
            width: 100px;
          }
          100% {
            width: 0;
          }
        }

        @keyframes shining {
          0% {
            width: 0;
          }
          50% {
            width: 30px;
          }
          100% {
            width: 0;
          }
        }

        @keyframes shooting {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(320px);
          }
        }

        @keyframes burger-pop {
          0% {
            opacity: 0;
            transform: translate(50%, -50%) rotate(45deg) scale(0.6);
          }
          20% {
            opacity: 1;
            transform: translate(50%, -50%) rotate(45deg) scale(1);
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(50%, -50%) rotate(45deg) scale(0.6);
          }
        }
      `}</style>
    </div>
  )
}
