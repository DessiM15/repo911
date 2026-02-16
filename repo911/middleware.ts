import { createServerClient } from '@supabase/ssr';
import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip i18n for auth routes, API routes, attorney routes, admin routes
  const isAuthRoute = pathname.startsWith('/auth');
  const isApiRoute = pathname.startsWith('/api');
  const isAttorneyRoute = pathname.startsWith('/attorney');
  const isAdminRoute = pathname.startsWith('/admin');
  const isInternalRoute = pathname.startsWith('/_next') || pathname.startsWith('/_vercel') || pathname.includes('.');

  if (isInternalRoute || isApiRoute) {
    return NextResponse.next();
  }

  // For attorney and admin routes, run auth middleware only (no i18n)
  if (isAttorneyRoute || isAdminRoute || isAuthRoute) {
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
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) => {
              // For attorney routes, omit maxAge/expires so cookies become
              // session-scoped (cleared when the browser is fully closed).
              const cookieOptions = isAttorneyRoute
                ? { ...options, maxAge: undefined, expires: undefined }
                : options;
              supabaseResponse.cookies.set(name, value, cookieOptions);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ---- Attorney Routes Protection ----
    if (pathname.startsWith('/attorney/register') || pathname.startsWith('/attorney/login') || pathname.startsWith('/attorney/forgot-password')) {
      if (user) {
        const url = request.nextUrl.clone();
        url.pathname = '/attorney/dashboard';
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    if (pathname.startsWith('/attorney')) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/attorney/login';
        url.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(url);
      }

      const { data: attorney } = await supabase
        .from('attorneys')
        .select('id, fee_agreement_signed, status')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!attorney) {
        const url = request.nextUrl.clone();
        url.pathname = '/attorney/register';
        return NextResponse.redirect(url);
      }

      if (!attorney.fee_agreement_signed && !pathname.startsWith('/attorney/register')) {
        const url = request.nextUrl.clone();
        url.pathname = '/attorney/register';
        return NextResponse.redirect(url);
      }

      if (attorney.status === 'suspended' || attorney.status === 'deactivated') {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = '/attorney/login';
        url.searchParams.set('error', 'account_suspended');
        return NextResponse.redirect(url);
      }
    }

    // ---- Admin Routes Protection ----
    if (pathname.startsWith('/admin/login') || pathname.startsWith('/admin/forgot-password')) {
      if (user) {
        const { data: admin } = await supabase
          .from('admins')
          .select('id')
          .eq('supabase_auth_id', user.id)
          .single();

        if (admin) {
          const url = request.nextUrl.clone();
          url.pathname = '/admin/dashboard';
          return NextResponse.redirect(url);
        }
      }
      return supabaseResponse;
    }

    if (pathname.startsWith('/admin')) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('redirectTo', pathname);
        return NextResponse.redirect(url);
      }

      const { data: admin } = await supabase
        .from('admins')
        .select('id, role')
        .eq('supabase_auth_id', user.id)
        .single();

      if (!admin) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }

    return supabaseResponse;
  }

  // For consumer routes, run i18n middleware
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
