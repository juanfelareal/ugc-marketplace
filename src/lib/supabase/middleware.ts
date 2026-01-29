import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Public paths that don't need auth
  const publicPaths = ['/login', '/signup', '/api/wompi/webhook', '/api/shopify/webhooks'];
  const isPublicPath = publicPaths.some((p) => pathname.startsWith(p));

  if (!user && !isPublicPath && !pathname.startsWith('/api/')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Check onboarding status for authenticated users
  if (user && !isPublicPath && !pathname.startsWith('/onboarding') && !pathname.startsWith('/api/')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, role')
      .eq('id', user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = profile.role === 'brand' ? '/onboarding/brand' : '/onboarding/creator';
      return NextResponse.redirect(url);
    }

    // Role-based route protection
    if (profile) {
      if (pathname.startsWith('/brand') && profile.role !== 'brand' && profile.role !== 'admin') {
        return NextResponse.redirect(new URL(`/${profile.role}/campaigns`, request.url));
      }
      if (pathname.startsWith('/creator') && profile.role !== 'creator' && profile.role !== 'admin') {
        return NextResponse.redirect(new URL(`/${profile.role}/campaigns`, request.url));
      }
      if (pathname.startsWith('/admin') && profile.role !== 'admin') {
        return NextResponse.redirect(new URL(`/${profile.role}/campaigns`, request.url));
      }
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const redirectPath = profile?.role === 'creator' ? '/creator/campaigns' : '/brand/campaigns';
    return NextResponse.redirect(new URL(redirectPath, request.url));
  }

  return supabaseResponse;
}
