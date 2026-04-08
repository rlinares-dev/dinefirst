import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  try {
    return await runMiddleware(request)
  } catch (err) {
    console.error('[middleware] error', err)
    return NextResponse.next()
  }
}

async function runMiddleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Si Supabase no está configurado, dejar pasar todo (modo localStorage)
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Obtener rol del usuario si está autenticado
  let userRole: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    userRole = profile?.role ?? null
  }

  // --- Rutas protegidas ---

  // /app/* requiere usuario autenticado
  if (pathname.startsWith('/app')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // /dashboard/* requiere rol restaurante, admin o camarero
  if (pathname.startsWith('/dashboard')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (userRole && userRole !== 'restaurante' && userRole !== 'admin' && userRole !== 'camarero') {
      return NextResponse.redirect(new URL('/app', request.url))
    }
    // Camareros no pueden acceder a rutas restringidas
    if (userRole === 'camarero') {
      const restricted = ['/dashboard/analiticas', '/dashboard/facturacion', '/dashboard/perfil', '/dashboard/equipo']
      if (restricted.some((r) => pathname.startsWith(r))) {
        return NextResponse.redirect(new URL('/dashboard/tpv', request.url))
      }
    }
  }

  // /admin/* requiere rol admin
  if (pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (userRole && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/app', request.url))
    }
  }

  // /login y /register redirigen si ya está autenticado
  if (pathname === '/login' || pathname === '/register') {
    if (user && userRole) {
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      if (userRole === 'restaurante') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
      if (userRole === 'camarero') {
        return NextResponse.redirect(new URL('/dashboard/tpv', request.url))
      }
      return NextResponse.redirect(new URL('/app', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|manifest.webmanifest).*)',
  ],
}
