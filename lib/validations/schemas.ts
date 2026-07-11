import { z } from "zod";

const usernameRegex = /^[a-zA-Z0-9_]+$/;

export const uuidSchema = z.string().uuid();
export const missionCategorySchema = z.enum([
  "social",
  "observation",
  "photo",
  "performance",
  "team",
  "low_key",
  "wildcard",
]);
export const missionDifficultySchema = z.enum([
  "easy",
  "medium",
  "hard",
  "chaotic_safe",
]);
export const missionTemplateStatusSchema = z.enum([
  "active",
  "pending_review",
  "archived",
  "rejected",
]);

export const authSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export const signupSchema = authSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, "Display name must be at least 2 characters.")
    .max(60, "Display name must be 60 characters or fewer."),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be 30 characters or fewer.")
    .regex(usernameRegex, "Use letters, numbers, and underscores only."),
});

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Group name must be at least 2 characters.")
    .max(80, "Group name must be 80 characters or fewer."),
});

export const joinGroupSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, "Enter a valid invite code.")
    .max(16, "Invite code is too long.")
    .transform((value) => value.toUpperCase()),
});

export const createPredictionSchema = z.object({
  groupId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(5, "Prediction title must be at least 5 characters.")
    .max(140, "Prediction title must be 140 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(600, "Description must be 600 characters or fewer.")
    .optional()
    .transform((value) => value || null),
  closesAt: z.string().refine(
    (value) => {
      const date = new Date(value);
      return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
    },
    { message: "Close time must be in the future." },
  ),
});

export const voteSchema = z.object({
  predictionId: uuidSchema,
  optionId: uuidSchema,
});

export const resolvePredictionSchema = z.object({
  predictionId: uuidSchema,
  winningOptionId: uuidSchema,
});

export const createMissionTemplateSchema = z.object({
  groupId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(3, "Mission title must be at least 3 characters.")
    .max(120, "Mission title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(600, "Description must be 600 characters or fewer.")
    .optional()
    .transform((value) => value || null),
  category: missionCategorySchema,
  difficulty: missionDifficultySchema,
  safetyNotes: z
    .string()
    .trim()
    .max(600, "Safety notes must be 600 characters or fewer.")
    .optional()
    .transform((value) => value || null),
});

export const updateMissionTemplateSchema = createMissionTemplateSchema.extend({
  templateId: uuidSchema,
  status: missionTemplateStatusSchema.optional(),
});

export const missionTemplateActionSchema = z.object({
  groupId: uuidSchema,
  templateId: uuidSchema,
});

export const createMissionOutingSchema = z.object({
  groupId: uuidSchema,
  title: z
    .string()
    .trim()
    .min(3, "Outing title must be at least 3 characters.")
    .max(120, "Outing title must be 120 characters or fewer."),
  venueType: z
    .string()
    .trim()
    .max(80, "Venue type must be 80 characters or fewer.")
    .optional()
    .transform((value) => value || null),
  vibe: z
    .string()
    .trim()
    .max(120, "Vibe must be 120 characters or fewer.")
    .optional()
    .transform((value) => value || null),
  startsAt: z
    .string()
    .optional()
    .transform((value) => value || null)
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        return !Number.isNaN(new Date(value).getTime());
      },
      { message: "Enter a valid start time." },
    ),
});

export const assignMissionsSchema = z.object({
  groupId: uuidSchema,
  outingId: uuidSchema,
});

export const missionAssignmentActionSchema = z.object({
  groupId: uuidSchema,
  outingId: uuidSchema,
  assignmentId: uuidSchema,
  verificationNote: z
    .string()
    .trim()
    .max(500, "Verification note must be 500 characters or fewer.")
    .optional()
    .transform((value) => value || null),
});

export const missionPreferencesSchema = z.object({
  groupId: uuidSchema,
  allowPerformance: z.boolean(),
  allowPhoto: z.boolean(),
  allowTalkingToStrangers: z.boolean(),
  allowDancing: z.boolean(),
  allowDrinkingRelated: z.boolean(),
  maxDifficulty: missionDifficultySchema,
});

export const aiGeneratedMissionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Generated mission title is too short.")
    .max(120, "Generated mission title is too long."),
  description: z
    .string()
    .trim()
    .max(600, "Generated mission description is too long.")
    .transform((value) => value || ""),
  category: missionCategorySchema,
  difficulty: missionDifficultySchema,
  safety_notes: z
    .string()
    .trim()
    .min(3, "Generated mission needs safety notes.")
    .max(600, "Generated mission safety notes are too long."),
});

export const aiGeneratedMissionsSchema = z.object({
  missions: z.array(aiGeneratedMissionSchema).min(1).max(20),
});

export const generateMissionTemplatesSchema = z.object({
  groupId: uuidSchema,
  count: z.coerce
    .number()
    .int("Choose a whole number of missions.")
    .min(1, "Generate at least 1 mission.")
    .max(20, "Generate 20 missions or fewer."),
  venueType: z
    .string()
    .trim()
    .max(80, "Venue type must be 80 characters or fewer.")
    .optional()
    .transform((value) => value || "bar or club"),
  vibe: z
    .string()
    .trim()
    .max(120, "Vibe must be 120 characters or fewer.")
    .optional()
    .transform((value) => value || "fun, casual, social"),
  categories: z.array(missionCategorySchema).min(1, "Choose at least one category."),
  difficultyMix: z
    .array(missionDifficultySchema)
    .min(1, "Choose at least one difficulty."),
});
