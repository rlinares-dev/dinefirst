import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/env'

// Allow static export (Capacitor mobile build) — this route won't be used in static mode
export const dynamic = 'force-static'

export async function GET(request: Request) {
  // In static export, request.url is not available — return basic redirect
  let url: URL
  try {
    url = new URL(request.url)
  } catch {
    return NextResponse.json({ error: 'Auth callback requires server mode' })
  }
  const { searchParams, origin } = url
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (code) {
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Obtener perfil para redirigir según rol
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          const role = (profile as { role: string }).role
          const redirectPath =
            role === 'admin' ? '/admin' :
            role === 'restaurante' ? '/dashboard' :
            '/app'
          return NextResponse.redirect(`${origin}${redirectPath}`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
