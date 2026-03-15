/**
 * Web Audio API notification sounds — no external dependencies.
 */

let audioCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = getContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  gain.gain.setValueAtTime(0.15, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration)
}

/** Short double-beep for new order notifications */
export function playOrderSound() {
  playTone(880, 0.15, 'sine')
  setTimeout(() => playTone(1100, 0.2, 'sine'), 180)
}

/** Single soft ping for general notifications */
export function playNotificationSound() {
  playTone(660, 0.25, 'triangle')
}
