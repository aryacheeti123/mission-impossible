"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbError } from "@/lib/actions/errors";
import { requireUser } from "@/lib/actions/session";
import { getProfilesByIds } from "@/lib/db/profiles";
import {
  DEV_GROUP_ID,
  DEV_NO_OPTION_ID,
  DEV_OPEN_PREDICTION_ID,
  DEV_RESOLVED_NO_OPTION_ID,
  DEV_RESOLVED_PREDICTION_ID,
  DEV_RESOLVED_YES_OPTION_ID,
  DEV_USER_ID,
  DEV_YES_OPTION_ID,
  isDevUser,
} from "@/lib/dev-auth";
import { formDataToObject, getEffectiveStatus } from "@/lib/utils";
import {
  createPredictionSchema,
  resolvePredictionSchema,
  uuidSchema,
  voteSchema,
} from "@/lib/validations/schemas";
import type {
  ActionState,
  PredictionDetail,
  PredictionOptionView,
  PredictionSummary,
} from "@/types/app";
import type { PredictionStatus } from "@/types/database";

type PredictionRow = {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  closes_at: string;
  status: PredictionStatus;
  resolved_option_id: string | null;
  resolved_outcome: string | null;
  created_at: string;
};

type OptionRow = {
  id: string;
  prediction_id: string;
  label: string;
  position: number;
};

type VoteRow = {
  id: string;
  prediction_id: string;
  option_id: string;
  user_id: string;
  created_at: string;
};

function devCreator() {
  return {
    id: DEV_USER_ID,
    displayName: "Dev Test",
    username: "devtest",
    avatarUrl: null,
  };
}

function devPredictions(): PredictionSummary[] {
  const now = Date.now();

  return [
    {
      id: DEV_OPEN_PREDICTION_ID,
      groupId: DEV_GROUP_ID,
      title: "Will Arya do a backflip at the bar tonight?",
      description: "Demo prediction for testing the app without Supabase Auth.",
      creator: devCreator(),
      closesAt: new Date(now + 60 * 60 * 1000).toISOString(),
      status: "open",
      effectiveStatus: "open",
      resolvedOutcome: null,
      resolvedOptionId: null,
      totalVotes: 3,
      options: [
        { id: DEV_YES_OPTION_ID, label: "Yes", position: 1, voteCount: 2 },
        { id: DEV_NO_OPTION_ID, label: "No", position: 2, voteCount: 1 },
      ],
      userVoteOptionId: null,
      createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
    },
    {
      id: DEV_RESOLVED_PREDICTION_ID,
      groupId: DEV_GROUP_ID,
      title: "Will the group order fries?",
      description: "Resolved demo prediction with a winning Yes outcome.",
      creator: devCreator(),
      closesAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
      status: "resolved",
      effectiveStatus: "resolved",
      resolvedOutcome: "Yes",
      resolvedOptionId: DEV_RESOLVED_YES_OPTION_ID,
      totalVotes: 4,
      options: [
        {
          id: DEV_RESOLVED_YES_OPTION_ID,
          label: "Yes",
          position: 1,
          voteCount: 3,
        },
        {
          id: DEV_RESOLVED_NO_OPTION_ID,
          label: "No",
          position: 2,
          voteCount: 1,
        },
      ],
      userVoteOptionId: DEV_RESOLVED_YES_OPTION_ID,
      createdAt: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function mapOptions(predictionId: string, options: OptionRow[], votes: VoteRow[]) {
  return options
    .filter((option) => option.prediction_id === predictionId)
    .sort((a, b) => a.position - b.position)
    .map<PredictionOptionView>((option) => ({
      id: option.id,
      label: option.label,
      position: option.position,
      voteCount: votes.filter((vote) => vote.option_id === option.id).length,
    }));
}

function toPredictionSummary(
  prediction: PredictionRow,
  options: OptionRow[],
  votes: VoteRow[],
  profiles: Awaited<ReturnType<typeof getProfilesByIds>>,
  userId: string,
): PredictionSummary {
  const predictionVotes = votes.filter(
    (vote) => vote.prediction_id === prediction.id,
  );
  const effectiveStatus = getEffectiveStatus(
    prediction.status,
    prediction.closes_at,
  ) as PredictionStatus;

  return {
    id: prediction.id,
    groupId: prediction.group_id,
    title: prediction.title,
    description: prediction.description,
    creator: profiles.get(prediction.created_by) ?? null,
    closesAt: prediction.closes_at,
    status: prediction.status,
    effectiveStatus,
    resolvedOutcome: prediction.resolved_outcome,
    resolvedOptionId: prediction.resolved_option_id,
    totalVotes: predictionVotes.length,
    options: mapOptions(prediction.id, options, votes),
    userVoteOptionId:
      predictionVotes.find((vote) => vote.user_id === userId)?.option_id ?? null,
    createdAt: prediction.created_at,
  };
}

export async function createPrediction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = createPredictionSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid prediction." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return {
      error:
        "Dev login uses read-only demo data. Connect Supabase to create predictions.",
    };
  }

  const { groupId, title, description, closesAt } = parsed.data;
  const { data, error } = await supabase
    .from("predictions")
    .insert({
      group_id: groupId,
      created_by: user.id,
      title,
      description,
      closes_at: new Date(closesAt).toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return dbError(error);
  }

  revalidatePath(`/groups/${groupId}`);
  redirect(`/predictions/${data.id}`);
}

export async function voteOnPrediction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = voteSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid vote." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return {
      success:
        "Dev vote accepted for the UI demo. Connect Supabase to persist votes.",
    };
  }

  const { predictionId, optionId } = parsed.data;
  const { error } = await supabase.from("votes").insert({
    prediction_id: predictionId,
    option_id: optionId,
    user_id: user.id,
    stake: 10,
  });

  if (error) {
    return dbError(error);
  }

  revalidatePath(`/predictions/${predictionId}`);
  return { success: "Vote locked." };
}

export async function resolvePrediction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resolvePredictionSchema.safeParse(formDataToObject(formData));

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid resolution." };
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return {
      success:
        "Dev resolution accepted for the UI demo. Connect Supabase to persist outcomes.",
    };
  }

  const { predictionId, winningOptionId } = parsed.data;
  const { error } = await supabase.rpc("resolve_prediction", {
    p_prediction_id: predictionId,
    p_winning_option_id: winningOptionId,
  });

  if (error) {
    return dbError(error);
  }

  revalidatePath(`/predictions/${predictionId}`);
  return { success: "Prediction resolved." };
}

export async function getGroupPredictions(groupId: string) {
  const parsed = uuidSchema.safeParse(groupId);

  if (!parsed.success) {
    return [];
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    return parsed.data === DEV_GROUP_ID ? devPredictions() : [];
  }

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select(
      "id, group_id, created_by, title, description, closes_at, status, resolved_option_id, resolved_outcome, created_at",
    )
    .eq("group_id", parsed.data)
    .order("created_at", { ascending: false });

  if (predictionsError) {
    throw new Error(predictionsError.message);
  }

  if (!predictions || predictions.length === 0) {
    return [];
  }

  const predictionIds = predictions.map((prediction) => prediction.id);
  const [{ data: options, error: optionsError }, { data: votes, error: votesError }] =
    await Promise.all([
      supabase
        .from("prediction_options")
        .select("id, prediction_id, label, position")
        .in("prediction_id", predictionIds),
      supabase
        .from("votes")
        .select("id, prediction_id, option_id, user_id, created_at")
        .in("prediction_id", predictionIds),
    ]);

  if (optionsError) {
    throw new Error(optionsError.message);
  }

  if (votesError) {
    throw new Error(votesError.message);
  }

  const profiles = await getProfilesByIds(
    supabase,
    predictions.map((prediction) => prediction.created_by),
  );

  return predictions.map((prediction) =>
    toPredictionSummary(
      prediction,
      options ?? [],
      votes ?? [],
      profiles,
      user.id,
    ),
  );
}

export async function getPredictionDetail(
  predictionId: string,
): Promise<PredictionDetail | null> {
  const parsed = uuidSchema.safeParse(predictionId);

  if (!parsed.success) {
    return null;
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    const summary = devPredictions().find(
      (prediction) => prediction.id === parsed.data,
    );

    if (!summary) {
      return null;
    }

    return {
      ...summary,
      groupName: "Dev Night Out",
      memberRole: "admin",
      canResolve: summary.effectiveStatus !== "open" && summary.status !== "resolved",
      votes: [],
    };
  }

  const { data: prediction, error: predictionError } = await supabase
    .from("predictions")
    .select(
      "id, group_id, created_by, title, description, closes_at, status, resolved_option_id, resolved_outcome, created_at",
    )
    .eq("id", parsed.data)
    .maybeSingle();

  if (predictionError) {
    throw new Error(predictionError.message);
  }

  if (!prediction) {
    return null;
  }

  const [
    { data: group, error: groupError },
    { data: membership, error: membershipError },
    { data: options, error: optionsError },
    { data: votes, error: votesError },
  ] = await Promise.all([
    supabase
      .from("groups")
      .select("id, name")
      .eq("id", prediction.group_id)
      .maybeSingle(),
    supabase
      .from("group_members")
      .select("role")
      .eq("group_id", prediction.group_id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("prediction_options")
      .select("id, prediction_id, label, position")
      .eq("prediction_id", prediction.id),
    supabase
      .from("votes")
      .select("id, prediction_id, option_id, user_id, created_at")
      .eq("prediction_id", prediction.id),
  ]);

  if (groupError) {
    throw new Error(groupError.message);
  }

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  if (optionsError) {
    throw new Error(optionsError.message);
  }

  if (votesError) {
    throw new Error(votesError.message);
  }

  if (!group || !membership) {
    return null;
  }

  const profiles = await getProfilesByIds(supabase, [
    prediction.created_by,
    ...(votes?.map((vote) => vote.user_id) ?? []),
  ]);
  const summary = toPredictionSummary(
    prediction,
    options ?? [],
    votes ?? [],
    profiles,
    user.id,
  );
  const canResolve =
    summary.status !== "resolved" &&
    summary.status !== "cancelled" &&
    summary.effectiveStatus !== "open" &&
    (prediction.created_by === user.id || membership.role === "admin");

  return {
    ...summary,
    groupName: group.name,
    memberRole: membership.role,
    canResolve,
    votes:
      votes?.map((vote) => ({
        id: vote.id,
        optionId: vote.option_id,
        userId: vote.user_id,
        voter: profiles.get(vote.user_id) ?? null,
        createdAt: vote.created_at,
      })) ?? [],
  };
}
