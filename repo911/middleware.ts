import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session (important for server components)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ---- Attorney Routes Protection ----
  // Allow register and login without auth
  if (pathname.startsWith('/attorney/register') || pathname.startsWith('/attorney/login')) {
    // If user is already logged in, redirect to dashboard
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = '/attorney/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // Protect all other attorney routes
  if (pathname.startsWith('/attorney')) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/attorney/login';
      url.searchParams.set('redirectTo', pathname);
      return NextResponse.redirect(url);
    }

    // Check if user has an attorney record with signed fee agreement
    const { data: attorney } = await supabase
      .from('attorneys')
      .select('id, fee_agreement_signed, status')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!attorney) {
      // User exists but no attorney record — redirect to registration
      const url = request.nextUrl.clone();
      url.pathname = '/attorney/register';
      return NextResponse.redirect(url);
    }

    if (!attorney.fee_agreement_signed && !pathname.startsWith('/attorney/register')) {
      // Attorney hasn't signed fee agreement yet
      const url = request.nextUrl.clone();
      url.pathname = '/attorney/register';
      return NextResponse.redirect(url);
    }

    if (attorney.status === 'suspended' || attorney.status === 'deactivated') {
      // Account suspended/deactivated — sign out and redirect
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/attorney/login';
      url.searchParams.set('error', 'account_suspended');
      return NextResponse.redirect(url);
    }
  }

  // ---- Admin Routes Protection ----
  if (pathname.startsWith('/admin/login')) {
    if (user) {
      // Check if user is actually an admin
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

    // Verify admin role
    const { data: admin } = await supabase
      .from('admins')
      .select('id, role')
      .eq('supabase_auth_id', user.id)
      .single();

    if (!admin) {
      // Not an admin — sign out and redirect
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/attorney/:path*',
    '/admin/:path*',
  ],
};
