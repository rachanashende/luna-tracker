"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-border bg-card p-6 shadow-sm"
    >
      <input type="hidden" name="redirectTo" value={redirectTo ?? ""} />

      <label htmlFor="password" className="text-sm font-medium text-heading">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoFocus
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
        {isPending ? "Checking…" : "Unlock"}
      </button>
    </form>
  );
}
