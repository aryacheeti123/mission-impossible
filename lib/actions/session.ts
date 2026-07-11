import { redirect } from "next/navigation";
import { getDevUser, hasDevSession } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if ((error || !user) && (await hasDevSession())) {
    return { supabase, user: getDevUser() };
  }

  if (error || !user) {
    redirect("/login");
  }

  return { supabase, user };
}
