import type { MissionDifficulty } from "@/types/database";

export const MISSION_REWARD_POINTS: Record<MissionDifficulty, number> = {
  easy: 5,
  medium: 10,
  hard: 20,
  chaotic_safe: 30,
};

export const MISSION_SAFETY_RULES = [
  "No harassment, humiliation, or targeting strangers.",
  "No pressure to drink, flirt, spend money, or perform sexually.",
  "No filming or photographing strangers without clear consent.",
  "No theft, vandalism, trespassing, fighting, illegal activity, or dangerous stunts.",
  "No bothering venue staff or disrupting the venue.",
  "No driving after drinking or any unsafe transportation challenge.",
];

const blockedPatterns = [
  /\bharass(?:ment|ing|ed)?\b/i,
  /\bpressure\b.*\bdrink/i,
  /\bmake\b.*\bdrink/i,
  /\bforce\b.*\bdrink/i,
  /\bshot(?:s)?\b/i,
  /\bchug\b/i,
  /\bsexual\b/i,
  /\bkiss\b/i,
  /\bflirt\b/i,
  /\bhook\s*up\b/i,
  /\bstranger\b.*\b(phone|number|dance|kiss|flirt|film|photo|record)\b/i,
  /\bfilm\b.*\bstranger/i,
  /\brecord\b.*\bstranger/i,
  /\bsteal\b/i,
  /\btheft\b/i,
  /\bvandal/i,
  /\btrespass/i,
  /\bfight\b/i,
  /\billegal\b/i,
  /\bdrug\b/i,
  /\bstaff\b.*\b(bother|annoy|prank|interrupt|argue)\b/i,
  /\bdrive\b.*\b(drunk|drink|drinking|alcohol)\b/i,
  /\bdangerous\b/i,
  /\bstunt\b/i,
  /\bhumiliat/i,
];

export function missionRewardPoints(difficulty: MissionDifficulty) {
  return MISSION_REWARD_POINTS[difficulty];
}

export function getMissionSafetyIssue(input: {
  title: string;
  description?: string | null;
  safetyNotes?: string | null;
}) {
  const text = [input.title, input.description, input.safetyNotes]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const blocked = blockedPatterns.find((pattern) => pattern.test(text));

  if (!blocked) {
    return null;
  }

  return "Mission appears to include unsafe, non-consensual, illegal, or venue-hostile behavior.";
}

export function isMissionSafe(input: {
  title: string;
  description?: string | null;
  safetyNotes?: string | null;
}) {
  return getMissionSafetyIssue(input) === null;
}
