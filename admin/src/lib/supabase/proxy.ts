import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import { supabasePublishableKey, supabaseUrl } from './env';
import type { Database } from './types';

/**
 * Routes reachable without a session (each with everything below it, so
 * `/login` covers `/login/forgot`). Everything else redirects to /login.
 * `/auth/confirm` is where the invite and password-reset emails land.
 */
const PUBLIC_PATHS = ['/login', '/auth/confirm', '/api/export', '/api/health'];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * Refreshes the Supabase session cookie on every request and bounces
 * unauthenticated visitors to the login page.
 *
 * Server components can't write cookies, so the refreshed token has to be
 * attached to a response here or sessions would silently expire mid-edit.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let noStoreHeaders: Record<string, string> = {};

  const supabase = createServerClient<Database>(supabaseUrl(), supabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // No-store headers, so a CDN never serves one editor's session cookie to another.
        noStoreHeaders = headers;
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Always call getUser() — it is what actually revalidates the token.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublic(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return redirectKeepingSession(url, response, noStoreHeaders);
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return redirectKeepingSession(url, response, noStoreHeaders);
  }

  return response;
}

/**
 * A redirect is a fresh response, so it would drop a session cookie that
 * getUser() just refreshed (or cleared), and the headers that keep it uncached.
 */
function redirectKeepingSession(url: URL, from: NextResponse, headers: Record<string, string>) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  Object.entries(headers).forEach(([key, value]) => redirect.headers.set(key, value));
  return redirect;
}
