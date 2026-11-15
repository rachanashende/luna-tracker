"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export type AuthState = { error?: string; notice?: string } | undefined;

const MIN_PASSWORD_LENGTH = 8;
const CONNECTION_ERROR = "Couldn't reach the server. Please try again in a moment.";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeRedirect(value: FormDataEntryValue | null): string {
  // Only allow same-site paths, and not protocol-relative ("//evil.com").
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : "/dashboard";
}

/** Compare two strings without leaking where they differ through timing. */
async function secretsMatch(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const va = new Uint8Array(ha);
  const vb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i];
  return diff === 0;
}

export async function login(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Network problems aren't the user's fault; don't call them a bad password.
      if (error.name === "AuthRetryableFetchError") return { error: CONNECTION_ERROR };
      // Don't reveal whether the email exists.
      return { error: "Incorrect email or password." };
    }
  } catch {
    return { error: CONNECTION_ERROR };
  }

  redirect(safeRedirect(formData.get("redirectTo")));
}

export async function signup(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  const expectedCode = process.env.INVITE_CODE;
  if (!expectedCode) {
    // Fail closed: with no code configured, nobody can create accounts.
    return { error: "Sign-ups are closed right now." };
  }
  if (!(await secretsMatch(inviteCode, expectedCode))) {
    return { error: "That invite code isn't right." };
  }

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Use at least ${MIN_PASSWORD_LENGTH} characters for your password.` };
  }
  if (password !== confirm) return { error: "The two passwords don't match." };

  let signedIn = false;
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      if (error.name === "AuthRetryableFetchError") return { error: CONNECTION_ERROR };
      return { error: error.message };
    }
    // With "Confirm email" off in Supabase, signUp returns a session and the
    // user is signed in straight away. With it on, they need to confirm first.
    signedIn = Boolean(data.session);
  } catch {
    return { error: CONNECTION_ERROR };
  }

  // redirect() works by throwing, so it must stay outside the try/catch.
  if (signedIn) redirect("/dashboard");
  return {
    notice: "Account created. Check your email for a confirmation link, then log in.",
  };
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
