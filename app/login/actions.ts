"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const password = formData.get("password");
  const redirectTo = formData.get("redirectTo");

  if (typeof password !== "string" || password.length === 0) {
    return { error: "Enter your password." };
  }

  const expected = process.env.APP_PASSWORD;
  const secret = process.env.SESSION_SECRET;

  if (!expected || !secret) {
    return {
      error:
        "Server isn't configured yet — set APP_PASSWORD and SESSION_SECRET in your env vars.",
    };
  }

  if (password !== expected) {
    return { error: "Incorrect password." };
  }

  const token = await createSessionToken(secret, SESSION_MAX_AGE);
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  const destination =
    typeof redirectTo === "string" && redirectTo.startsWith("/")
      ? redirectTo
      : "/dashboard";

  redirect(destination);
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
