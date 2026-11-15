"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup, type AuthState } from "../login/actions";

const input =
  "mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-accent-secondary focus:ring-2 focus:ring-accent-secondary/40";

export default function SignupForm() {
  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signup,
    undefined
  );

  return (
    <form
      action={formAction}
      className="rounded-3xl border border-border bg-card p-6 shadow-sm"
    >
      <label htmlFor="inviteCode" className="text-sm font-medium text-heading">
        Invite code
      </label>
      <input
        id="inviteCode"
        name="inviteCode"
        type="text"
        autoComplete="off"
        autoFocus
        required
        placeholder="Ask the person who invited you"
        className={input}
      />

      <label htmlFor="email" className="mt-4 block text-sm font-medium text-heading">
        Email
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="you@example.com"
        className={input}
      />

      <label htmlFor="password" className="mt-4 block text-sm font-medium text-heading">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        placeholder="At least 8 characters"
        className={input}
      />

      <label htmlFor="confirm" className="mt-4 block text-sm font-medium text-heading">
        Confirm password
      </label>
      <input
        id="confirm"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        className={input}
      />

      {state?.error && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {state.error}
        </p>
      )}
      {state?.notice && (
        <p className="mt-3 text-sm text-heading" role="status">
          {state.notice}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-5 w-full rounded-xl bg-accent px-4 py-2.5 font-medium text-heading transition hover:brightness-95 disabled:opacity-60"
      >
        {isPending ? "Creating account…" : "Create account"}
      </button>

      <p className="mt-4 text-center text-sm text-foreground/70">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-heading underline underline-offset-2">
          Log in
        </Link>
      </p>
    </form>
  );
}
