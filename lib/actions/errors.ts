import type { PostgrestError } from "@supabase/supabase-js";
import type { ActionState } from "@/types/app";

const knownMessages: Record<string, string> = {
  "already voted": "You already voted on this prediction.",
  "voting closed": "Voting is closed for this prediction.",
  "not enough points": "You need at least 10 points in this group to vote.",
  "not a group member": "You are not a member of this group.",
  "unauthorized resolution": "Only the creator or a group admin can resolve this.",
  "invalid invite code": "That invite code does not match a group.",
  "prediction already resolved": "This prediction has already been resolved.",
  "prediction cancelled": "This prediction was cancelled.",
  "prediction is still open": "This prediction can be resolved after voting closes.",
  "invalid winning option": "Choose a valid winning option.",
  "admin required": "Only group admins can do that.",
  "no active missions": "Add at least one active mission before assigning.",
  "outing not found": "Mission outing not found.",
  "outing is not assignable": "This outing cannot receive new assignments.",
  "mission assignment not found": "Mission assignment not found.",
  "users cannot verify their own mission": "Ask another group member to verify your mission.",
  "mission is not ready for verification": "This mission is not ready for verification yet.",
  "mission assignment fields cannot be changed": "That mission assignment cannot be changed directly.",
  "invalid assignment update": "That mission status change is not allowed.",
  "invalid verifier": "Mission verifier must match the signed-in user.",
};

export function fieldError(error: unknown): ActionState {
  if (error instanceof Error) {
    return { error: error.message };
  }

  return { error: "Something went wrong." };
}

export function dbError(error: PostgrestError | null): ActionState {
  if (!error) {
    return { error: "Something went wrong." };
  }

  if (error.code === "23505") {
    return { error: "You already voted on this prediction." };
  }

  const normalized = error.message.toLowerCase();
  const match = Object.entries(knownMessages).find(([key]) =>
    normalized.includes(key),
  );

  if (match) {
    return { error: match[1] };
  }

  if (normalized.includes("row-level security")) {
    return { error: "You are not authorized to do that." };
  }

  return { error: error.message };
}
