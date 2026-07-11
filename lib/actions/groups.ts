"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbError } from "@/lib/actions/errors";
import { requireUser } from "@/lib/actions/session";
import { DEV_GROUP_ID, isDevUser } from "@/lib/dev-auth";
import { formDataToObject } from "@/lib/utils";
import {
  createGroupSchema,
  joinGroupSchema,
  uuidSchema,
} from "@/lib/validations/schemas";
import type { ActionState, GroupDetail, UserGroup } from "@/types/app";

export async function createGroup(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createGroupSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid group." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return {
      error:
        "Dev login uses read-only demo data. Connect Supabase to create groups.",
    };
  }

  const { data, error } = await supabase
    .rpc("create_group", { p_name: parsed.data.name })
    .single();

  if (error || !data) {
    return dbError(error);
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${data.group_id}`);
}

export async function joinGroup(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = joinGroupSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid invite code." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return {
      error:
        "Dev login uses read-only demo data. Connect Supabase to join groups.",
    };
  }

  const { data, error } = await supabase
    .rpc("join_group", { p_invite_code: parsed.data.inviteCode })
    .single();

  if (error || !data) {
    return dbError(error);
  }

  revalidatePath("/dashboard");
  redirect(`/groups/${data.group_id}`);
}

export async function getUserGroups(): Promise<UserGroup[]> {
  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return [
      {
        id: DEV_GROUP_ID,
        name: "Dev Night Out",
        inviteCode: "DEVTEST",
        role: "admin",
        memberCount: 4,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("group_members")
    .select("group_id, role, joined_at")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  if (membershipsError) {
    throw new Error(membershipsError.message);
  }

  const groupIds = memberships?.map((membership) => membership.group_id) ?? [];

  if (groupIds.length === 0) {
    return [];
  }

  const [{ data: groups, error: groupsError }, { data: memberRows, error: membersError }] =
    await Promise.all([
      supabase
        .from("groups")
        .select("id, name, invite_code, created_at")
        .in("id", groupIds),
      supabase.from("group_members").select("group_id").in("group_id", groupIds),
    ]);

  if (groupsError) {
    throw new Error(groupsError.message);
  }

  if (membersError) {
    throw new Error(membersError.message);
  }

  const groupsById = new Map(groups?.map((group) => [group.id, group]) ?? []);
  const memberCounts = new Map<string, number>();
  memberRows?.forEach((row) => {
    memberCounts.set(row.group_id, (memberCounts.get(row.group_id) ?? 0) + 1);
  });

  return memberships
    .map((membership) => {
      const group = groupsById.get(membership.group_id);

      if (!group) {
        return null;
      }

      return {
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        role: membership.role,
        memberCount: memberCounts.get(group.id) ?? 1,
        createdAt: group.created_at,
      };
    })
    .filter((group): group is UserGroup => group !== null);
}

export async function getGroupDetail(groupId: string): Promise<GroupDetail | null> {
  const parsed = uuidSchema.safeParse(groupId);

  if (!parsed.success) {
    return null;
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    if (parsed.data !== DEV_GROUP_ID) {
      return null;
    }

    return {
      id: DEV_GROUP_ID,
      name: "Dev Night Out",
      inviteCode: "DEVTEST",
      role: "admin",
      memberCount: 4,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
    };
  }

  const [{ data: group, error: groupError }, { data: membership }] =
    await Promise.all([
      supabase
        .from("groups")
        .select("id, name, invite_code, created_by, created_at")
        .eq("id", parsed.data)
        .maybeSingle(),
      supabase
        .from("group_members")
        .select("role")
        .eq("group_id", parsed.data)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  if (groupError) {
    throw new Error(groupError.message);
  }

  if (!group || !membership) {
    return null;
  }

  const { data: memberRows, error: membersError } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("group_id", parsed.data);

  if (membersError) {
    throw new Error(membersError.message);
  }

  return {
    id: group.id,
    name: group.name,
    inviteCode: group.invite_code,
    role: membership.role,
    memberCount: memberRows?.length ?? 1,
    createdAt: group.created_at,
    createdBy: group.created_by,
  };
}
