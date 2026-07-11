import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

export const DEV_SESSION_COOKIE = "mission_impossible_dev_session";
export const DEV_SESSION_VALUE = "dev-test";
export const DEV_USER_ID = "00000000-0000-4000-8000-000000000001";
export const DEV_GROUP_ID = "00000000-0000-4000-8000-000000000101";
export const DEV_OPEN_PREDICTION_ID = "00000000-0000-4000-8000-000000000201";
export const DEV_RESOLVED_PREDICTION_ID = "00000000-0000-4000-8000-000000000202";
export const DEV_YES_OPTION_ID = "00000000-0000-4000-8000-000000000301";
export const DEV_NO_OPTION_ID = "00000000-0000-4000-8000-000000000302";
export const DEV_RESOLVED_YES_OPTION_ID = "00000000-0000-4000-8000-000000000303";
export const DEV_RESOLVED_NO_OPTION_ID = "00000000-0000-4000-8000-000000000304";

export function isDevLoginEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_LOGIN_ENABLED === "true"
  );
}

export function isDevUser(userId?: string) {
  return isDevLoginEnabled() && userId === DEV_USER_ID;
}

export function hasDevSessionValue(value?: string) {
  return isDevLoginEnabled() && value === DEV_SESSION_VALUE;
}

export async function hasDevSession() {
  const cookieStore = await cookies();
  return hasDevSessionValue(cookieStore.get(DEV_SESSION_COOKIE)?.value);
}

export async function setDevSession() {
  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, DEV_SESSION_VALUE, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
  });
}

export async function clearDevSession() {
  const cookieStore = await cookies();
  cookieStore.delete(DEV_SESSION_COOKIE);
}

export function getDevUser(): User {
  return {
    id: DEV_USER_ID,
    aud: "authenticated",
    role: "authenticated",
    email: "devtest@missionimpossible.local",
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {
      display_name: "Dev Test",
      username: "devtest",
    },
    identities: [],
    factors: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
  };
}
