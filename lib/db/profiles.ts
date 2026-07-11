import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfileLite } from "@/types/app";
import type { Database } from "@/types/database";

export function toProfileLite(row: {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
}): ProfileLite {
  return {
    id: row.id,
    displayName: row.display_name,
    username: row.username,
    avatarUrl: row.avatar_url,
  };
}

export async function getProfilesByIds(
  supabase: SupabaseClient<Database>,
  ids: string[],
) {
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean);
  const profiles = new Map<string, ProfileLite>();

  if (uniqueIds.length === 0) {
    return profiles;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, username, avatar_url")
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  data?.forEach((profile) => {
    profiles.set(profile.id, toProfileLite(profile));
  });

  return profiles;
}
