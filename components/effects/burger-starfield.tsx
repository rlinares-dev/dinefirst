'use client'

import { useEffect, useState, CSSProperties } from 'react'

interface Shooter {
  id: number
  top: string
  left: string
  delay: string
  duration: string
}

const TOTAL_BURGERS = 28
const INITIAL_DELAY_S = 0.2

// v2: cae como estrella fugaz (rotateZ -45deg en wrapper).
// Delays escalonados: el primero aparece a ~1s, el resto se encadena suavemente.
function buildBurgerShooters(): Shooter[] {
  // Grid 7×4 = 28 celdas usando casi todo el ancho/alto.
  // Las celdas se BARAJAN para que hamburguesas con delays consecutivos
  // aparezcan en posiciones lejanas (evita la "línea diagonal" visible).
  const COLS = 7
  const ROWS = 4
  const cellW = 100 / COLS
  const cellH = 100 / ROWS
  // Construye la lista de celdas y la baraja (Fisher-Yates determinista)
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
    // Cada hamburguesa ocupa el 90% de su celda con un offset aleatorio
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

export function BurgerStarfield() {
  const [shooters, setShooters] = useState<Shooter[]>([])

  useEffect(() => {
    setShooters(buildBurgerShooters())
  }, [])

  return (
    <div className="burger-stars pointer-events-none absolute inset-0 overflow-hidden">
      {/* Rotated container — hace que todos los hijos se desplacen diagonalmente.
          Usamos style inline para evitar bugs de caché de styled-jsx en HMR. */}
      <div
        className="stars-inner"
        style={{
          position: 'absolute',
          inset: 0,
          // 135deg → eje X del frame rotado apunta hacia abajo-izquierda
          // → las hamburguesas CAEN desde arriba-derecha hacia abajo-izquierda
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
            <span className="burger-head">🍔</span>
          </div>
        ))}
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
      `}</style>
    </div>
  )
}
