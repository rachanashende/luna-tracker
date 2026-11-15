import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-xl">
            🌙
          </div>
          <h1 className="font-display text-2xl font-semibold text-heading">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Log in to open your tracker.
          </p>
        </div>

        <Suspense fallback={null}>
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function LoginFormWithParams({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return <LoginForm redirectTo={from} />;
}
