/**
 * Rate limiting simple en memoria.
 * Para producción, usar Redis o Supabase para persistir entre instancias.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Limpiar entradas expiradas cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

interface RateLimitConfig {
  /** Máximo de intentos en la ventana */
  maxAttempts: number
  /** Duración de la ventana en milisegundos */
  windowMs: number
}

export const RATE_LIMITS = {
  login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 } as RateLimitConfig,      // 5 intentos / 15 min
  register: { maxAttempts: 3, windowMs: 60 * 60 * 1000 } as RateLimitConfig,    // 3 intentos / 1 hora
  review: { maxAttempts: 10, windowMs: 60 * 60 * 1000 } as RateLimitConfig,     // 10 reseñas / hora
  reservation: { maxAttempts: 10, windowMs: 60 * 60 * 1000 } as RateLimitConfig, // 10 reservas / hora
} as const

/**
 * Verifica y consume un intento de rate limit.
 * @returns { success: true } si se permite, { success: false, retryAfter } si está limitado.
 */
export function checkRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMITS
): { success: boolean; retryAfter?: number; remaining?: number } {
  const config = RATE_LIMITS[action]
  const key = `${action}:${identifier}`
  const now = Date.now()

  const entry = store.get(key)

  // Si no hay entrada o ya expiró, crear nueva
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + config.windowMs })
    return { success: true, remaining: config.maxAttempts - 1 }
  }

  // Si hay entrada y no ha expirado
  if (entry.count >= config.maxAttempts) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { success: false, retryAfter }
  }

  // Incrementar contador
  entry.count++
  return { success: true, remaining: config.maxAttempts - entry.count }
}

/**
 * Obtener IP del request (para uso en API routes y middleware).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}
