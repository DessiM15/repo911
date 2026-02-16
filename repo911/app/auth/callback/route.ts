import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function getSafeRedirectUrl(next: string | null, requestUrl: string): string {
  const fallback = '/';
  if (!next) return fallback;

  try {
    const url = new URL(next, requestUrl);
    const origin = new URL(requestUrl).origin;
    if (url.origin !== origin) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const next = getSafeRedirectUrl(searchParams.get('next'), request.url);

  if (code) {
    try {
      const supabaseResponse = NextResponse.redirect(new URL(next, request.url));

      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) => {
                supabaseResponse.cookies.set(name, value, options);
              });
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        return supabaseResponse;
      }
    } catch {
      // Exchange failed — fall through to default redirect
    }
  }

  // If no code or exchange failed, redirect to home
  return NextResponse.redirect(new URL('/', request.url));
}
