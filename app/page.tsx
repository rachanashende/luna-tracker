import { redirect } from "next/navigation";
import { getSupabaseUserClient } from "@/lib/supabase-server";

export default async function Home() {
  const user = await getSupabaseUserClient();
  redirect(user ? "/dashboard" : "/login");
}
