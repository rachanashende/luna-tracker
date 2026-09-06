import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export default async function Home() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const authenticated = await verifySessionToken(
    token,
    process.env.SESSION_SECRET ?? ""
  );

  redirect(authenticated ? "/dashboard" : "/login");
}
