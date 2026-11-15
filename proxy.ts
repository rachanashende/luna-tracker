import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Paths that don't require a signed-in user. Everything else falls under the
// matcher below and gets checked.
const PUBLIC_PATHS = ["/login", "/signup"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  // Standard Supabase session-refresh pattern: read the auth cookies from the
  // request, and if Supabase refreshes the token, write the new cookies to
  // both the request (so server code sees them) and the response (so the
  // browser keeps them).
  let response = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            req.cookies.set(name, value);
          }
          response = NextResponse.next({ request: req });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Verifies the token's signature; doesn't trust the cookie blindly.
  const { data } = await supabase.auth.getClaims();
  const authenticated = Boolean(data?.claims?.sub);

  // A redirect must carry along any refreshed auth cookies.
  const redirectTo = (url: URL) => {
    const redirect = NextResponse.redirect(url);
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  if (isPublic) {
    // Already signed in and hitting /login or /signup → send them somewhere useful.
    if (authenticated) {
      return redirectTo(new URL("/dashboard", req.url));
    }
    return response;
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return redirectTo(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
