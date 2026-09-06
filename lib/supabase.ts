import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-safe client — uses the public URL + anon key. Only ever reads/writes
 * through Postgres RLS policies (we don't have per-user accounts, so keep this
 * client read-only in practice and do writes through /app/api/* routes with
 * the service-role client below).
 */
let browserClient: SupabaseClient | undefined;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY env vars."
      );
    }

    browserClient = createClient(url, anonKey);
  }

  return browserClient;
}

/**
 * Server-only client — uses the service-role key, which bypasses RLS.
 * Import this ONLY from files that never ship to the browser: app/api/*
 * route handlers and server actions. Never import this from a Client
 * Component or anything under "use client".
 */
let serviceClient: SupabaseClient | undefined;

export function getSupabaseServiceClient(): SupabaseClient {
  if (!serviceClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
      );
    }

    serviceClient = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  }

  return serviceClient;
}
