import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/**
 * Supabase client for the *signed-in user*, built per request from the auth
 * cookies. Queries made with it run as that user, so Postgres row-level
 * security (see supabase/005_multi_user.sql) only lets them see and change
 * their own rows.
 *
 * Use this in server components, server actions and API routes. The
 * service-role client in lib/supabase.ts bypasses RLS and is now only for
 * storage signing, after ownership has been checked through this client.
 */
export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
    );
  }

  const store = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(cookiesToSet) {
        // Server components can't set cookies; the proxy refreshes the
        // session on every request, so ignoring that error here is safe.
        try {
          for (const { name, value, options } of cookiesToSet) {
            store.set(name, value, options);
          }
        } catch {}
      },
    },
  });
}

export type UserContext = {
  supabase: SupabaseClient;
  userId: string;
  email: string | undefined;
};

/**
 * The signed-in user's client plus their id, or null if nobody is signed in.
 * The session token's signature is verified, not just read from the cookie.
 */
export async function getSupabaseUserClient(): Promise<UserContext | null> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return {
    supabase,
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : undefined,
  };
}

/** Standard response for API routes when nobody is signed in. */
export function unauthorized() {
  return NextResponse.json({ error: "Not signed in" }, { status: 401 });
}
