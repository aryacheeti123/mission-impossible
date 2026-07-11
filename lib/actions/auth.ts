"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearDevSession, setDevSession } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";
import { formDataToObject } from "@/lib/utils";
import { authSchema, signupSchema } from "@/lib/validations/schemas";
import type { ActionState } from "@/types/app";

export async function signIn(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = authSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid login." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid sign-up." };
  }

  const { email, password, displayName, username } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        username,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/dashboard");
  }

  return { success: "Check your email to confirm your account." };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearDevSession();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function devSignIn() {
  await setDevSession();
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
