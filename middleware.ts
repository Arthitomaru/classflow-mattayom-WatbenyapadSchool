import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const publicAuthPaths = ['/login', '/signup', '/forgot-password', '/update-password']

  if (pathname === '/') {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const dest = profile?.role === 'teacher' ? '/teacher' : profile?.role === 'admin' ? '/admin' : '/student'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (publicAuthPaths.includes(pathname)) {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', user.id).single()
      const dest = profile?.role === 'teacher' ? '/teacher' : profile?.role === 'admin' ? '/admin' : '/student'
      return NextResponse.redirect(new URL(dest, request.url))
    }
    return supabaseResponse
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf)).*)',
  ],
}
