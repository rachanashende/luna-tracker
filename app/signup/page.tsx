import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-xl">
            🌙
          </div>
          <h1 className="font-display text-2xl font-semibold text-heading">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            You&apos;ll need an invite code to join Luna.
          </p>
        </div>

        <SignupForm />
      </div>
    </main>
  );
}
