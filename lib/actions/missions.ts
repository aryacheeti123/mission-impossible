"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbError, fieldError } from "@/lib/actions/errors";
import { requireUser } from "@/lib/actions/session";
import { getProfilesByIds } from "@/lib/db/profiles";
import { DEV_GROUP_ID, DEV_USER_ID, isDevUser } from "@/lib/dev-auth";
import {
  getMissionSafetyIssue,
  missionRewardPoints,
  MISSION_SAFETY_RULES,
} from "@/lib/mission-safety";
import { formDataToObject } from "@/lib/utils";
import {
  aiGeneratedMissionsSchema,
  assignMissionsSchema,
  createMissionOutingSchema,
  createMissionTemplateSchema,
  generateMissionTemplatesSchema,
  missionAssignmentActionSchema,
  missionPreferencesSchema,
  missionTemplateActionSchema,
  updateMissionTemplateSchema,
  uuidSchema,
} from "@/lib/validations/schemas";
import type {
  ActionState,
  MissionAssignmentView,
  MissionDashboard,
  MissionOutingDetail,
  MissionOutingView,
  MissionPreferenceView,
  MissionTemplateView,
} from "@/types/app";
import type { Database, MemberRole } from "@/types/database";

type MissionTemplateRow =
  Database["public"]["Tables"]["mission_templates"]["Row"];
type MissionOutingRow = Database["public"]["Tables"]["mission_outings"]["Row"];
type MissionAssignmentRow =
  Database["public"]["Tables"]["mission_assignments"]["Row"];
type MissionPreferenceRow =
  Database["public"]["Tables"]["mission_preferences"]["Row"];

type SupabaseServerClient = Awaited<ReturnType<typeof requireUser>>["supabase"];

const safeFallbackExamples = [
  "Take a group photo where everyone poses like they are in a rap album cover.",
  "Convince the group to create a fake backstory for one friend for the next 10 minutes.",
  "Give a 20-second fake award speech about someone in the group.",
  "Find the most dramatic lighting in the bar and take a group picture there.",
  "Create a secret handshake with one person in the group.",
  "Make one friend laugh without using words.",
  "Pick a theme song for each person in the group.",
];

const missionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["missions"],
  properties: {
    missions: {
      type: "array",
      minItems: 1,
      maxItems: 20,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "title",
          "description",
          "category",
          "difficulty",
          "safety_notes",
        ],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 120 },
          description: { type: "string", maxLength: 600 },
          category: {
            type: "string",
            enum: [
              "social",
              "observation",
              "photo",
              "performance",
              "team",
              "low_key",
              "wildcard",
            ],
          },
          difficulty: {
            type: "string",
            enum: ["easy", "medium", "hard", "chaotic_safe"],
          },
          safety_notes: { type: "string", minLength: 3, maxLength: 600 },
        },
      },
    },
  },
};

function toTemplateView(row: MissionTemplateRow): MissionTemplateView {
  return {
    id: row.id,
    groupId: row.group_id,
    createdBy: row.created_by,
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    source: row.source,
    status: row.status,
    safetyNotes: row.safety_notes,
    createdAt: row.created_at,
  };
}

function toOutingView(row: MissionOutingRow): MissionOutingView {
  return {
    id: row.id,
    groupId: row.group_id,
    createdBy: row.created_by,
    title: row.title,
    venueType: row.venue_type,
    vibe: row.vibe,
    startsAt: row.starts_at,
    status: row.status,
    createdAt: row.created_at,
  };
}

function toPreferenceView(row?: MissionPreferenceRow | null): MissionPreferenceView {
  return {
    allowPerformance: row?.allow_performance ?? true,
    allowPhoto: row?.allow_photo ?? true,
    allowTalkingToStrangers: row?.allow_talking_to_strangers ?? false,
    allowDancing: row?.allow_dancing ?? true,
    allowDrinkingRelated: row?.allow_drinking_related ?? false,
    maxDifficulty: row?.max_difficulty ?? "medium",
  };
}

async function getMembership(
  supabase: SupabaseServerClient,
  groupId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.role ?? null;
}

async function requireGroupRole(
  supabase: SupabaseServerClient,
  groupId: string,
  userId: string,
): Promise<MemberRole | ActionState> {
  const role = await getMembership(supabase, groupId, userId);

  if (!role) {
    return { error: "You are not a member of this group." };
  }

  return role;
}

async function requireAdminRole(
  supabase: SupabaseServerClient,
  groupId: string,
  userId: string,
): Promise<ActionState | null> {
  const role = await requireGroupRole(supabase, groupId, userId);

  if (typeof role !== "string") {
    return role;
  }

  if (role !== "admin") {
    return { error: "Only group admins can manage missions." };
  }

  return null;
}

function invalidSafeMission(input: {
  title: string;
  description?: string | null;
  safetyNotes?: string | null;
}) {
  const issue = getMissionSafetyIssue(input);
  return issue ? { error: issue } : null;
}

function devTemplates(): MissionTemplateView[] {
  const now = new Date().toISOString();

  return [
    {
      id: "00000000-0000-4000-8000-000000000401",
      groupId: DEV_GROUP_ID,
      createdBy: DEV_USER_ID,
      title: "Rap album cover pose",
      description:
        "Take a group photo where everyone poses like they are in a rap album cover.",
      category: "photo",
      difficulty: "easy",
      source: "manual",
      status: "active",
      safetyNotes: "Only photograph people in your own group.",
      createdAt: now,
    },
    {
      id: "00000000-0000-4000-8000-000000000402",
      groupId: DEV_GROUP_ID,
      createdBy: DEV_USER_ID,
      title: "Fake award speech",
      description: "Give a 20-second fake award speech about someone in the group.",
      category: "performance",
      difficulty: "medium",
      source: "manual",
      status: "active",
      safetyNotes: "Keep it kind and inside the friend group.",
      createdAt: now,
    },
    {
      id: "00000000-0000-4000-8000-000000000403",
      groupId: DEV_GROUP_ID,
      createdBy: DEV_USER_ID,
      title: "Silent laugh challenge",
      description: "Make one friend laugh without using words.",
      category: "social",
      difficulty: "easy",
      source: "ai_generated",
      status: "pending_review",
      safetyNotes: "No targeting strangers or embarrassing anyone.",
      createdAt: now,
    },
  ];
}

function devOutings(): MissionOutingView[] {
  const now = new Date().toISOString();

  return [
    {
      id: "00000000-0000-4000-8000-000000000501",
      groupId: DEV_GROUP_ID,
      createdBy: DEV_USER_ID,
      title: "Dev Friday Night",
      venueType: "bar",
      vibe: "fun and low pressure",
      startsAt: now,
      status: "active",
      createdAt: now,
    },
  ];
}

function devAssignment(): MissionAssignmentView {
  const mission = devTemplates()[0] ?? null;

  return {
    id: "00000000-0000-4000-8000-000000000601",
    outingId: devOutings()[0]!.id,
    groupId: DEV_GROUP_ID,
    userId: DEV_USER_ID,
    assignee: {
      id: DEV_USER_ID,
      displayName: "Dev Test",
      username: "devtest",
      avatarUrl: null,
    },
    mission,
    status: "assigned",
    assignedAt: new Date().toISOString(),
    completedAt: null,
    verifiedBy: null,
    verifier: null,
    verificationNote: null,
    rewardPoints: mission ? missionRewardPoints(mission.difficulty) : 0,
    canVerify: false,
    isOwnAssignment: true,
  };
}

function assignmentToView({
  assignment,
  mission,
  profiles,
  userId,
}: {
  assignment: MissionAssignmentRow;
  mission: MissionTemplateView | null;
  profiles: Awaited<ReturnType<typeof getProfilesByIds>>;
  userId: string;
}): MissionAssignmentView {
  return {
    id: assignment.id,
    outingId: assignment.outing_id,
    groupId: assignment.group_id,
    userId: assignment.user_id,
    assignee: profiles.get(assignment.user_id) ?? null,
    mission,
    status: assignment.status,
    assignedAt: assignment.assigned_at,
    completedAt: assignment.completed_at,
    verifiedBy: assignment.verified_by,
    verifier: assignment.verified_by
      ? profiles.get(assignment.verified_by) ?? null
      : null,
    verificationNote: assignment.verification_note,
    rewardPoints: mission ? missionRewardPoints(mission.difficulty) : 0,
    canVerify: assignment.status === "completed" && assignment.user_id !== userId,
    isOwnAssignment: assignment.user_id === userId,
  };
}

function extractResponseText(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "output_text" in payload &&
    typeof payload.output_text === "string"
  ) {
    return payload.output_text;
  }

  if (!payload || typeof payload !== "object" || !("output" in payload)) {
    return "";
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  return output
    .flatMap((item) => {
      if (!item || typeof item !== "object" || !("content" in item)) {
        return [];
      }

      const content: unknown[] = Array.isArray(item.content)
        ? item.content
        : [];
      return content.map((part) => {
        if (part && typeof part === "object" && "text" in part) {
          return typeof part.text === "string" ? part.text : "";
        }

        return "";
      });
    })
    .join("");
}

export async function createMissionTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createMissionTemplateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid mission." };
  }

  const safetyError = invalidSafeMission(parsed.data);

  if (safetyError) {
    return safetyError;
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return {
      error: "Dev login uses read-only demo missions. Connect Supabase to save missions.",
    };
  }

  const adminError = await requireAdminRole(supabase, parsed.data.groupId, user.id);

  if (adminError) {
    return adminError;
  }

  const { error } = await supabase.from("mission_templates").insert({
    group_id: parsed.data.groupId,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description,
    category: parsed.data.category,
    difficulty: parsed.data.difficulty,
    source: "manual",
    status: "active",
    safety_notes: parsed.data.safetyNotes,
  });

  if (error) {
    return dbError(error);
  }

  revalidatePath(`/groups/${parsed.data.groupId}/missions`);
  redirect(`/groups/${parsed.data.groupId}/missions`);
}

export async function updateMissionTemplate(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = updateMissionTemplateSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid mission." };
  }

  const safetyError = invalidSafeMission(parsed.data);

  if (safetyError) {
    return safetyError;
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return { success: "Dev mission updated in the UI demo." };
  }

  const adminError = await requireAdminRole(supabase, parsed.data.groupId, user.id);

  if (adminError) {
    return adminError;
  }

  const { error } = await supabase
    .from("mission_templates")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      difficulty: parsed.data.difficulty,
      status: parsed.data.status,
      safety_notes: parsed.data.safetyNotes,
    })
    .eq("id", parsed.data.templateId)
    .eq("group_id", parsed.data.groupId);

  if (error) {
    return dbError(error);
  }

  revalidatePath(`/groups/${parsed.data.groupId}/missions`);
  revalidatePath(`/groups/${parsed.data.groupId}/missions/review`);
  return { success: "Mission updated." };
}

async function setMissionTemplateStatus(
  formData: FormData,
  status: "active" | "archived" | "rejected",
) {
  const parsed = missionTemplateActionSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid mission." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return { success: "Dev mission status updated in the UI demo." };
  }

  const adminError = await requireAdminRole(supabase, parsed.data.groupId, user.id);

  if (adminError) {
    return adminError;
  }

  const { error } = await supabase
    .from("mission_templates")
    .update({ status })
    .eq("id", parsed.data.templateId)
    .eq("group_id", parsed.data.groupId);

  if (error) {
    return dbError(error);
  }

  revalidatePath(`/groups/${parsed.data.groupId}/missions`);
  revalidatePath(`/groups/${parsed.data.groupId}/missions/review`);
  return {
    success:
      status === "active"
        ? "Mission approved."
        : status === "archived"
          ? "Mission archived."
          : "Mission rejected.",
  };
}

export async function archiveMissionTemplate(
  _prevState: ActionState,
  formData: FormData,
) {
  return setMissionTemplateStatus(formData, "archived");
}

export async function approveMissionTemplate(
  _prevState: ActionState,
  formData: FormData,
) {
  return setMissionTemplateStatus(formData, "active");
}

export async function rejectMissionTemplate(
  _prevState: ActionState,
  formData: FormData,
) {
  return setMissionTemplateStatus(formData, "rejected");
}

export async function deleteMissionTemplate(
  _prevState: ActionState,
  formData: FormData,
) {
  const parsed = missionTemplateActionSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid mission." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return { success: "Dev mission deleted in the UI demo." };
  }

  const adminError = await requireAdminRole(supabase, parsed.data.groupId, user.id);

  if (adminError) {
    return adminError;
  }

  const { error } = await supabase
    .from("mission_templates")
    .delete()
    .eq("id", parsed.data.templateId)
    .eq("group_id", parsed.data.groupId);

  if (error) {
    return dbError(error);
  }

  revalidatePath(`/groups/${parsed.data.groupId}/missions`);
  revalidatePath(`/groups/${parsed.data.groupId}/missions/review`);
  return { success: "Mission deleted." };
}

export async function generateMissionTemplatesWithAI(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = generateMissionTemplatesSchema.safeParse({
    ...formDataToObject(formData),
    categories: formData.getAll("categories"),
    difficultyMix: formData.getAll("difficultyMix"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid generation settings." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return {
      success:
        "Dev AI generation preview complete. Connect OpenAI and Supabase to save generated missions.",
    };
  }

  const adminError = await requireAdminRole(supabase, parsed.data.groupId, user.id);

  if (adminError) {
    return adminError;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return { error: "Add OPENAI_API_KEY to .env.local before generating missions." };
  }

  const { data: examples, error: examplesError } = await supabase
    .from("mission_templates")
    .select("title, description, category, difficulty, safety_notes")
    .eq("group_id", parsed.data.groupId)
    .eq("source", "manual")
    .order("created_at", { ascending: false })
    .limit(12);

  if (examplesError) {
    return dbError(examplesError);
  }

  const exampleLines =
    examples && examples.length > 0
      ? examples.map(
          (mission) =>
            `- ${mission.title}: ${mission.description ?? "No description"} (${mission.category}, ${mission.difficulty})`,
        )
      : safeFallbackExamples.map((example) => `- ${example}`);

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You generate safe, consent-aware bar and club missions for private friend groups. Return only JSON that matches the requested schema.",
        },
        {
          role: "user",
          content: [
            `Generate ${parsed.data.count} missions similar in tone to these examples:`,
            ...exampleLines,
            "",
            `Venue type: ${parsed.data.venueType}`,
            `Vibe: ${parsed.data.vibe}`,
            `Allowed categories: ${parsed.data.categories.join(", ")}`,
            `Allowed difficulties: ${parsed.data.difficultyMix.join(", ")}`,
            "",
            "Rules:",
            "- Keep missions safe, legal, consent-aware, and venue-friendly.",
            "- Avoid sexual pressure, alcohol pressure, harassment, illegal activity, staff harassment, filming strangers without consent, dangerous physical acts, and property damage.",
            "- Missions should be funny, social, and achievable.",
            "- Missions should work in a bar/club setting.",
            "- Missions should not require spending money.",
            "- Missions should not require bothering strangers.",
            "- Some missions can involve observing the environment, but not interacting with unwilling strangers.",
            ...MISSION_SAFETY_RULES.map((rule) => `- ${rule}`),
          ].join("\n"),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "mission_generation",
          strict: true,
          schema: missionJsonSchema,
        },
      },
      temperature: 0.8,
      max_output_tokens: 2200,
      store: false,
    }),
  });

  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error &&
      typeof payload.error === "object" &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
        ? payload.error.message
        : "AI mission generation failed.";

    return { error: message };
  }

  let json: unknown;

  try {
    json = JSON.parse(extractResponseText(payload));
  } catch (error) {
    return fieldError(
      error instanceof Error
        ? new Error("AI returned invalid JSON. Try again with fewer missions.")
        : error,
    );
  }

  const generated = aiGeneratedMissionsSchema.safeParse(json);

  if (!generated.success) {
    return { error: "AI returned missions that did not match the required schema." };
  }

  const safeMissions = generated.data.missions.filter(
    (mission) =>
      !getMissionSafetyIssue({
        title: mission.title,
        description: mission.description,
        safetyNotes: mission.safety_notes,
      }),
  );

  if (safeMissions.length === 0) {
    return { error: "AI did not return any missions that passed safety review." };
  }

  const { error } = await supabase.from("mission_templates").insert(
    safeMissions.map((mission) => ({
      group_id: parsed.data.groupId,
      created_by: user.id,
      title: mission.title,
      description: mission.description || null,
      category: mission.category,
      difficulty: mission.difficulty,
      source: "ai_generated",
      status: "pending_review",
      safety_notes: mission.safety_notes,
    })),
  );

  if (error) {
    return dbError(error);
  }

  revalidatePath(`/groups/${parsed.data.groupId}/missions`);
  revalidatePath(`/groups/${parsed.data.groupId}/missions/review`);

  const rejectedCount = generated.data.missions.length - safeMissions.length;
  return {
    success:
      rejectedCount > 0
        ? `${safeMissions.length} missions saved for review. ${rejectedCount} unsafe missions were rejected.`
        : `${safeMissions.length} missions saved for review.`,
  };
}

export async function createMissionOuting(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createMissionOutingSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid outing." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return {
      error:
        "Dev login uses read-only demo outings. Connect Supabase to create outings.",
    };
  }

  const adminError = await requireAdminRole(supabase, parsed.data.groupId, user.id);

  if (adminError) {
    return adminError;
  }

  const { data, error } = await supabase
    .from("mission_outings")
    .insert({
      group_id: parsed.data.groupId,
      created_by: user.id,
      title: parsed.data.title,
      venue_type: parsed.data.venueType,
      vibe: parsed.data.vibe,
      starts_at: parsed.data.startsAt
        ? new Date(parsed.data.startsAt).toISOString()
        : null,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError(error);
  }

  revalidatePath(`/groups/${parsed.data.groupId}/missions`);
  redirect(`/groups/${parsed.data.groupId}/missions/outings/${data.id}`);
}

export async function assignRandomMissionsForOuting(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = assignMissionsSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid outing." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return { success: "Dev missions assigned in the UI demo." };
  }

  const adminError = await requireAdminRole(supabase, parsed.data.groupId, user.id);

  if (adminError) {
    return adminError;
  }

  const { data, error } = await supabase
    .rpc("assign_missions_to_members", {
      p_group_id: parsed.data.groupId,
      p_outing_id: parsed.data.outingId,
    })
    .single();

  if (error || !data) {
    return dbError(error);
  }

  revalidatePath(
    `/groups/${parsed.data.groupId}/missions/outings/${parsed.data.outingId}`,
  );

  if (data.warning) {
    return {
      success: `${data.assigned_count} missions assigned. ${data.warning}`,
    };
  }

  return { success: `${data.assigned_count} missions assigned.` };
}

export async function getUserMissionAssignment(groupId: string, outingId: string) {
  const parsedGroup = uuidSchema.safeParse(groupId);
  const parsedOuting = uuidSchema.safeParse(outingId);

  if (!parsedGroup.success || !parsedOuting.success) {
    return null;
  }

  const detail = await getMissionOutingDetail(parsedGroup.data, parsedOuting.data);
  return detail?.userAssignment ?? null;
}

export async function markMissionCompleted(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = missionAssignmentActionSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid mission." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return { success: "Dev mission marked complete in the UI demo." };
  }

  const role = await requireGroupRole(supabase, parsed.data.groupId, user.id);

  if (typeof role !== "string") {
    return role;
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("mission_assignments")
    .select("id, group_id, outing_id, user_id, status")
    .eq("id", parsed.data.assignmentId)
    .maybeSingle();

  if (assignmentError) {
    return dbError(assignmentError);
  }

  if (
    !assignment ||
    assignment.group_id !== parsed.data.groupId ||
    assignment.outing_id !== parsed.data.outingId ||
    assignment.user_id !== user.id
  ) {
    return { error: "You can only complete your own mission." };
  }

  const { error } = await supabase
    .from("mission_assignments")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", parsed.data.assignmentId);

  if (error) {
    return dbError(error);
  }

  revalidatePath(
    `/groups/${parsed.data.groupId}/missions/outings/${parsed.data.outingId}`,
  );
  return { success: "Mission marked complete. Ask another group member to verify it." };
}

export async function skipMissionAssignment(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = missionAssignmentActionSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid mission." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return { success: "Dev mission skipped in the UI demo." };
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("mission_assignments")
    .select("id, group_id, outing_id, user_id")
    .eq("id", parsed.data.assignmentId)
    .maybeSingle();

  if (assignmentError) {
    return dbError(assignmentError);
  }

  if (
    !assignment ||
    assignment.group_id !== parsed.data.groupId ||
    assignment.outing_id !== parsed.data.outingId ||
    assignment.user_id !== user.id
  ) {
    return { error: "You can only skip your own mission." };
  }

  const { error } = await supabase
    .from("mission_assignments")
    .update({ status: "skipped" })
    .eq("id", parsed.data.assignmentId);

  if (error) {
    return dbError(error);
  }

  revalidatePath(
    `/groups/${parsed.data.groupId}/missions/outings/${parsed.data.outingId}`,
  );
  return { success: "Mission skipped." };
}

export async function verifyMissionCompletion(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = missionAssignmentActionSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid verification." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return { success: "Dev mission verified in the UI demo." };
  }

  const role = await requireGroupRole(supabase, parsed.data.groupId, user.id);

  if (typeof role !== "string") {
    return role;
  }

  const { error } = await supabase.rpc("verify_mission_assignment", {
    p_assignment_id: parsed.data.assignmentId,
    p_note: parsed.data.verificationNote,
  });

  if (error) {
    return dbError(error);
  }

  revalidatePath(
    `/groups/${parsed.data.groupId}/missions/outings/${parsed.data.outingId}`,
  );
  return { success: "Mission verified and points awarded." };
}

export async function rejectMissionCompletion(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = missionAssignmentActionSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid verification." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return { success: "Dev mission rejected in the UI demo." };
  }

  const role = await requireGroupRole(supabase, parsed.data.groupId, user.id);

  if (typeof role !== "string") {
    return role;
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("mission_assignments")
    .select("id, group_id, outing_id, user_id, status")
    .eq("id", parsed.data.assignmentId)
    .maybeSingle();

  if (assignmentError) {
    return dbError(assignmentError);
  }

  if (
    !assignment ||
    assignment.group_id !== parsed.data.groupId ||
    assignment.outing_id !== parsed.data.outingId
  ) {
    return { error: "Mission assignment not found." };
  }

  if (assignment.user_id === user.id) {
    return { error: "You cannot verify or reject your own mission." };
  }

  const { error } = await supabase
    .from("mission_assignments")
    .update({
      status: "rejected",
      verified_by: user.id,
      verification_note: parsed.data.verificationNote,
    })
    .eq("id", parsed.data.assignmentId);

  if (error) {
    return dbError(error);
  }

  revalidatePath(
    `/groups/${parsed.data.groupId}/missions/outings/${parsed.data.outingId}`,
  );
  return { success: "Mission completion rejected." };
}

export async function updateMissionPreferences(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = missionPreferencesSchema.safeParse({
    groupId: formData.get("groupId"),
    allowPerformance: formData.has("allowPerformance"),
    allowPhoto: formData.has("allowPhoto"),
    allowTalkingToStrangers: formData.has("allowTalkingToStrangers"),
    allowDancing: formData.has("allowDancing"),
    allowDrinkingRelated: formData.has("allowDrinkingRelated"),
    maxDifficulty: formData.get("maxDifficulty"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid preferences." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return { success: "Dev preferences saved in the UI demo." };
  }

  const role = await requireGroupRole(supabase, parsed.data.groupId, user.id);

  if (typeof role !== "string") {
    return role;
  }

  const { error } = await supabase.from("mission_preferences").upsert(
    {
      group_id: parsed.data.groupId,
      user_id: user.id,
      allow_performance: parsed.data.allowPerformance,
      allow_photo: parsed.data.allowPhoto,
      allow_talking_to_strangers: parsed.data.allowTalkingToStrangers,
      allow_dancing: parsed.data.allowDancing,
      allow_drinking_related: parsed.data.allowDrinkingRelated,
      max_difficulty: parsed.data.maxDifficulty,
    },
    { onConflict: "group_id,user_id" },
  );

  if (error) {
    return dbError(error);
  }

  revalidatePath(`/groups/${parsed.data.groupId}/missions/preferences`);
  return { success: "Mission preferences saved." };
}

export async function getGroupMissionDashboard(
  groupId: string,
): Promise<MissionDashboard | null> {
  const parsed = uuidSchema.safeParse(groupId);

  if (!parsed.success) {
    return null;
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    if (parsed.data !== DEV_GROUP_ID) {
      return null;
    }

    const templates = devTemplates();
    return {
      groupId: DEV_GROUP_ID,
      canAdmin: true,
      activeMissionCount: templates.filter((mission) => mission.status === "active")
        .length,
      pendingMissionCount: templates.filter(
        (mission) => mission.status === "pending_review",
      ).length,
      activeMissions: templates.filter((mission) => mission.status === "active"),
      pendingMissions: templates.filter(
        (mission) => mission.status === "pending_review",
      ),
      recentOutings: devOutings(),
    };
  }

  const role = await getMembership(supabase, parsed.data, user.id);

  if (!role) {
    return null;
  }

  const [
    { data: activeTemplates, error: activeError },
    { data: pendingTemplates, error: pendingError },
    { data: outings, error: outingsError },
  ] = await Promise.all([
    supabase
      .from("mission_templates")
      .select(
        "id, group_id, created_by, title, description, category, difficulty, source, status, safety_notes, created_at, updated_at",
      )
      .eq("group_id", parsed.data)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    role === "admin"
      ? supabase
          .from("mission_templates")
          .select(
            "id, group_id, created_by, title, description, category, difficulty, source, status, safety_notes, created_at, updated_at",
          )
          .eq("group_id", parsed.data)
          .eq("status", "pending_review")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("mission_outings")
      .select(
        "id, group_id, created_by, title, venue_type, vibe, starts_at, status, created_at",
      )
      .eq("group_id", parsed.data)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  if (activeError) {
    throw new Error(activeError.message);
  }

  if (pendingError) {
    throw new Error(pendingError.message);
  }

  if (outingsError) {
    throw new Error(outingsError.message);
  }

  const active = (activeTemplates ?? []).map(toTemplateView);
  const pending = (pendingTemplates ?? []).map(toTemplateView);

  return {
    groupId: parsed.data,
    canAdmin: role === "admin",
    activeMissionCount: active.length,
    pendingMissionCount: pending.length,
    activeMissions: active,
    pendingMissions: pending,
    recentOutings: (outings ?? []).map(toOutingView),
  };
}

export async function getMissionPreferences(
  groupId: string,
): Promise<MissionPreferenceView | null> {
  const parsed = uuidSchema.safeParse(groupId);

  if (!parsed.success) {
    return null;
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return toPreferenceView(null);
  }

  const role = await getMembership(supabase, parsed.data, user.id);

  if (!role) {
    return null;
  }

  const { data, error } = await supabase
    .from("mission_preferences")
    .select(
      "id, group_id, user_id, allow_performance, allow_photo, allow_talking_to_strangers, allow_dancing, allow_drinking_related, max_difficulty, created_at, updated_at",
    )
    .eq("group_id", parsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return toPreferenceView(data);
}

export async function getMissionOutingDetail(
  groupId: string,
  outingId: string,
): Promise<MissionOutingDetail | null> {
  const parsedGroup = uuidSchema.safeParse(groupId);
  const parsedOuting = uuidSchema.safeParse(outingId);

  if (!parsedGroup.success || !parsedOuting.success) {
    return null;
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    if (parsedGroup.data !== DEV_GROUP_ID) {
      return null;
    }

    const outing = devOutings().find((item) => item.id === parsedOuting.data);

    if (!outing) {
      return null;
    }

    const assignment = devAssignment();
    return {
      outing,
      groupName: "Dev Night Out",
      canAdmin: true,
      activeMissionCount: devTemplates().filter(
        (mission) => mission.status === "active",
      ).length,
      assignmentCount: 1,
      assignments: [assignment],
      userAssignment: assignment,
      verificationQueue: [],
    };
  }

  const role = await getMembership(supabase, parsedGroup.data, user.id);

  if (!role) {
    return null;
  }

  const [
    { data: group, error: groupError },
    { data: outing, error: outingError },
    { data: activeTemplates, error: activeTemplatesError },
    { data: assignments, error: assignmentsError },
    { count: assignmentCount, error: assignmentCountError },
  ] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name")
      .eq("id", parsedGroup.data)
      .maybeSingle(),
    supabase
      .from("mission_outings")
      .select(
        "id, group_id, created_by, title, venue_type, vibe, starts_at, status, created_at",
      )
      .eq("id", parsedOuting.data)
      .eq("group_id", parsedGroup.data)
      .maybeSingle(),
    supabase
      .from("mission_templates")
      .select("id")
      .eq("group_id", parsedGroup.data)
      .eq("status", "active"),
    supabase
      .from("mission_assignments")
      .select(
        "id, outing_id, group_id, user_id, mission_template_id, status, assigned_at, completed_at, verified_by, verification_note, rerolled_from_assignment_id",
      )
      .eq("outing_id", parsedOuting.data)
      .eq("group_id", parsedGroup.data)
      .order("assigned_at", { ascending: true }),
    supabase
      .from("mission_assignments")
      .select("id", { count: "exact", head: true })
      .eq("outing_id", parsedOuting.data)
      .eq("group_id", parsedGroup.data),
  ]);

  if (groupError) {
    throw new Error(groupError.message);
  }

  if (outingError) {
    throw new Error(outingError.message);
  }

  if (activeTemplatesError) {
    throw new Error(activeTemplatesError.message);
  }

  if (assignmentsError) {
    throw new Error(assignmentsError.message);
  }

  if (assignmentCountError) {
    throw new Error(assignmentCountError.message);
  }

  if (!group || !outing) {
    return null;
  }

  const templateIds = Array.from(
    new Set((assignments ?? []).map((assignment) => assignment.mission_template_id)),
  );
  const { data: templates, error: templatesError } =
    templateIds.length > 0
      ? await supabase
          .from("mission_templates")
          .select(
            "id, group_id, created_by, title, description, category, difficulty, source, status, safety_notes, created_at, updated_at",
          )
          .in("id", templateIds)
      : { data: [], error: null };

  if (templatesError) {
    throw new Error(templatesError.message);
  }

  const templateMap = new Map(
    (templates ?? []).map((template) => [template.id, toTemplateView(template)]),
  );
  const profileIds = [
    ...(assignments?.map((assignment) => assignment.user_id) ?? []),
    ...(assignments?.map((assignment) => assignment.verified_by).filter(Boolean) ??
      []),
  ] as string[];
  const profiles = await getProfilesByIds(supabase, profileIds);
  const assignmentViews =
    assignments?.map((assignment) =>
      assignmentToView({
        assignment,
        mission: templateMap.get(assignment.mission_template_id) ?? null,
        profiles,
        userId: user.id,
      }),
    ) ?? [];

  return {
    outing: toOutingView(outing),
    groupName: group.name,
    canAdmin: role === "admin",
    activeMissionCount: activeTemplates?.length ?? 0,
    assignmentCount: assignmentCount ?? assignmentViews.length,
    assignments: assignmentViews,
    userAssignment:
      assignmentViews.find((assignment) => assignment.userId === user.id) ?? null,
    verificationQueue: assignmentViews.filter(
      (assignment) => assignment.canVerify && assignment.status === "completed",
    ),
  };
}
