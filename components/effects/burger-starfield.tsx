'use client'

import { useEffect, useState, useCallback, CSSProperties } from 'react'

interface Shooter {
  id: number
  top: string
  left: string
  delay: string
  duration: string
}

interface Explosion {
  id: number
  x: number
  y: number
  particles: { angle: number; speed: number; size: number; emoji: string; rotation: number }[]
}

const TOTAL_BURGERS = 28
const INITIAL_DELAY_S = 0.2
const EXPLOSION_EMOJIS = ['🍞', '🥬', '🧀', '🥩', '🍅', '🥒', '🧅', '🥚', '🫒', '🥓', '🍳']

function buildBurgerShooters(): Shooter[] {
  const COLS = 7
  const ROWS = 4
  const cellW = 100 / COLS
  const cellH = 100 / ROWS
  const cells: { col: number; row: number }[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) cells.push({ col: c, row: r })
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[cells[i], cells[j]] = [cells[j], cells[i]]
  }
  const dur = 24
  return cells.map((cell, idx) => {
    const left = cell.col * cellW + 5 + Math.random() * cellW * 0.6
    const top = cell.row * cellH + 5 + Math.random() * cellH * 0.6
    const startDelay = INITIAL_DELAY_S + (idx * dur) / TOTAL_BURGERS
    return {
      id: idx,
      top: `${top.toFixed(1)}%`,
      left: `${left.toFixed(1)}%`,
      delay: `${startDelay.toFixed(2)}s`,
      duration: `${dur.toFixed(2)}s`,
    }
  })
}

let explosionSeq = 0

export function BurgerStarfield() {
  const [shooters, setShooters] = useState<Shooter[]>([])
  const [explosions, setExplosions] = useState<Explosion[]>([])
  const [explodedIds, setExplodedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    setShooters(buildBurgerShooters())
  }, [])

  const handleBurgerClick = useCallback((e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement
    const shooterId = Number(target.dataset.shooterId)
    if (explodedIds.has(shooterId)) return

    const rect = target.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const id = explosionSeq++
    const particles = Array.from({ length: 12 }, () => ({
      angle: Math.random() * Math.PI * 2,
      speed: 60 + Math.random() * 120,
      size: 14 + Math.random() * 14,
      emoji: EXPLOSION_EMOJIS[Math.floor(Math.random() * EXPLOSION_EMOJIS.length)],
      rotation: Math.random() * 360,
    }))

    // Ocultar la hamburguesa inmediatamente
    setExplodedIds((prev) => new Set(prev).add(shooterId))

    setExplosions((prev) => [...prev, { id, x, y, particles }])
    setTimeout(() => {
      setExplosions((prev) => prev.filter((ex) => ex.id !== id))
    }, 1000)
  }, [explodedIds])

  return (
    <>
      {/* Explosion layer — above everything */}
      <div className="pointer-events-none fixed inset-0 z-[70]">
        {explosions.map((ex) => (
          <div key={ex.id} style={{ position: 'absolute', left: ex.x, top: ex.y }}>
            {/* Central flash */}
            <span className="explosion-flash" />
            {/* Shockwave ring */}
            <span className="explosion-ring" />
            {/* Flying particles */}
            {ex.particles.map((p, i) => (
              <span
                key={i}
                className="explosion-particle"
                style={{
                  '--ex-dx': `${Math.cos(p.angle) * p.speed}px`,
                  '--ex-dy': `${Math.sin(p.angle) * p.speed}px`,
                  '--ex-rot': `${p.rotation}deg`,
                  '--ex-size': `${p.size}px`,
                } as CSSProperties}
              >
                {p.emoji}
              </span>
            ))}
          </div>
        ))}
      </div>

      <div className="burger-stars pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="stars-inner"
          style={{
            position: 'absolute',
            inset: 0,
            transform: 'rotateZ(135deg)',
          }}
        >
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
              <span
                className={`burger-head${explodedIds.has(s.id) ? ' exploded' : ''}`}
                style={{ pointerEvents: explodedIds.has(s.id) ? 'none' : 'auto' }}
                data-shooter-id={s.id}
                onMouseEnter={handleBurgerClick}
              >
                🍔
              </span>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .burger-stars {
          /* Fondo degradado estilo codepen, con colores del proyecto */
          background: radial-gradient(ellipse at bottom, #1a0f08 0%, #050310 60%, #020108 100%);
        }

        /* Cada shooting star: una barra horizontal con gradiente (cola) */
        .shooting_star {
          position: absolute;
          height: 2px;
          background: linear-gradient(-45deg, #f97316, rgba(249, 115, 22, 0));
          border-radius: 999px;
          filter: drop-shadow(0 0 6px #fdba74);
          animation: tail var(--duration) linear infinite,
            shooting var(--duration) linear infinite;
          animation-delay: var(--delay);
          animation-fill-mode: both;
          width: 0;
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
          animation-fill-mode: both;
          width: 0;
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
          animation-fill-mode: both;
          width: 0;
        }

        /* La hamburguesa va en la cabeza de la estrella fugaz */
        .burger-head {
          position: absolute;
          top: 50%;
          right: 0;
          font-size: 22px;
          line-height: 1;
          transform: translate(50%, -50%) rotate(-135deg) scale(0);
          opacity: 0;
          filter: drop-shadow(0 0 8px #f97316);
          animation: burger-pop var(--duration) ease-out infinite;
          animation-delay: var(--delay);
          animation-fill-mode: both;
        }

        /* Estrella fugaz: aparece RÁPIDO en los primeros ~3% del ciclo,
           luego se desliza LENTAMENTE y se desvanece hasta el 30%.
           El resto del ciclo está invisible (limita el nº de simultáneas). */
        @keyframes tail {
          0% {
            width: 0;
            opacity: 0;
          }
          1.5% {
            width: 140px;
            opacity: 1;
          }
          18% {
            width: 140px;
            opacity: 1;
          }
          24% {
            width: 80px;
            opacity: 0.4;
          }
          25%,
          100% {
            width: 0;
            opacity: 0;
          }
        }

        @keyframes shining {
          0% {
            width: 0;
            opacity: 0;
          }
          3% {
            width: 35px;
            opacity: 1;
          }
          12% {
            width: 18px;
            opacity: 0.5;
          }
          22%,
          100% {
            width: 0;
            opacity: 0;
          }
        }

        @keyframes shooting {
          0% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(600px);
          }
          25.01%,
          100% {
            transform: translateX(600px);
          }
        }

        /* La hamburguesa aparece RÁPIDO (pop), luego permanece visible y
           se desvanece LENTO mientras la estrella se desliza. */
        @keyframes burger-pop {
          0% {
            opacity: 0;
            transform: translate(50%, -50%) rotate(-135deg) scale(0);
          }
          1.5% {
            opacity: 1;
            transform: translate(50%, -50%) rotate(-135deg) scale(1.1);
          }
          3% {
            opacity: 1;
            transform: translate(50%, -50%) rotate(-135deg) scale(1);
          }
          20% {
            opacity: 1;
            transform: translate(50%, -50%) rotate(-135deg) scale(1);
          }
          25%,
          100% {
            opacity: 0;
            transform: translate(50%, -50%) rotate(-135deg) scale(0.7);
          }
        }
        /* Hamburguesa explotada: desaparece instantáneamente */
        .burger-head.exploded {
          opacity: 0 !important;
          transform: translate(50%, -50%) rotate(-135deg) scale(0) !important;
          animation: none !important;
          pointer-events: none;
        }

        /* ─── Explosion effects ─── */

        .explosion-flash {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          margin: -20px 0 0 -20px;
          border-radius: 50%;
          background: radial-gradient(circle, #fff 0%, #f97316 40%, transparent 70%);
          animation: flash-pop 0.4s ease-out forwards;
          pointer-events: none;
        }

        .explosion-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          margin: -5px 0 0 -5px;
          border-radius: 50%;
          border: 2px solid #f97316;
          animation: ring-expand 0.6s ease-out forwards;
          pointer-events: none;
        }

        .explosion-particle {
          position: absolute;
          top: 0;
          left: 0;
          font-size: var(--ex-size);
          line-height: 1;
          transform: translate(-50%, -50%);
          animation: particle-fly 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
          pointer-events: none;
        }

        @keyframes flash-pop {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(2.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }

        @keyframes ring-expand {
          0% {
            transform: scale(0);
            opacity: 1;
            border-width: 3px;
          }
          100% {
            transform: scale(12);
            opacity: 0;
            border-width: 0.5px;
          }
        }

        @keyframes particle-fly {
          0% {
            transform: translate(-50%, -50%) rotate(0deg) scale(1);
            opacity: 1;
          }
          30% {
            opacity: 1;
            transform: translate(
              calc(-50% + var(--ex-dx) * 0.6),
              calc(-50% + var(--ex-dy) * 0.6)
            ) rotate(var(--ex-rot)) scale(1.2);
          }
          100% {
            transform: translate(
              calc(-50% + var(--ex-dx)),
              calc(-50% + var(--ex-dy) + 30px)
            ) rotate(var(--ex-rot)) scale(0.3);
            opacity: 0;
          }
        }
      `}</style>
    </>
  )
}
