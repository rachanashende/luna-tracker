"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type AuthState } from "./actions";

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    login,
    undefined
  );

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-border bg-card p-6 shadow-sm"
    >
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

      <label htmlFor="email" className="text-sm font-medium text-heading">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        autoFocus
        required
        placeholder="you@example.com"
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-accent-secondary focus:ring-2 focus:ring-accent-secondary/40"
      />

      <label
        htmlFor="password"
        className="mt-4 block text-sm font-medium text-heading"
      >
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        placeholder="••••••••"
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-accent-secondary focus:ring-2 focus:ring-accent-secondary/40"
      />

      {state?.error && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-heading transition hover:brightness-95 disabled:opacity-60"
      >
        {isPending ? "Logging in…" : "Log in"}
      </button>

      <p className="mt-4 text-center text-sm text-foreground/70">
        New here?{" "}
        <Link href="/signup" className="font-medium text-heading underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </form>
  );
}
