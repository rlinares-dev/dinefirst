import { z } from 'zod'

/**
 * Validación de variables de entorno.
 * Se ejecuta en cliente y servidor — solo valida NEXT_PUBLIC_* en cliente.
 */

const envSchema = z.object({
  // Supabase (requeridas para producción, opcionales en dev con localStorage)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // Supabase server-only (solo disponible en server)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // n8n webhook (opcional — modo test de notificaciones)
  NEXT_PUBLIC_N8N_WEBHOOK_URL: z.string().url().optional().or(z.literal('')),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
})

export type Env = z.infer<typeof envSchema>

function getEnv(): Env {
  const parsed = envSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_N8N_WEBHOOK_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  })

  if (!parsed.success) {
    console.warn(
      '⚠️ Variables de entorno inválidas:',
      parsed.error.flatten().fieldErrors
    )
    // No lanzamos error — en dev funciona con localStorage sin Supabase
    return envSchema.parse({})
  }

  return parsed.data
}

export const env = getEnv()

/**
 * Verifica si Supabase está configurado correctamente.
 * Si no lo está, la app funciona en modo localStorage (mock data).
 */
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
