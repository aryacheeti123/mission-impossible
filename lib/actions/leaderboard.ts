"use server";

import { requireUser } from "@/lib/actions/session";
import { getProfilesByIds } from "@/lib/db/profiles";
import { DEV_GROUP_ID, DEV_USER_ID, isDevUser } from "@/lib/dev-auth";
import { uuidSchema } from "@/lib/validations/schemas";
import type { LeaderboardRow } from "@/types/app";

export async function getGroupLeaderboard(
  groupId: string,
): Promise<LeaderboardRow[]> {
  const parsed = uuidSchema.safeParse(groupId);

  if (!parsed.success) {
    return [];
  }

  const { supabase, user } = await requireUser();

  if (isDevUser(user.id)) {
    if (parsed.data !== DEV_GROUP_ID) {
      return [];
    }

    return [
      {
        rank: 1,
        userId: DEV_USER_ID,
        displayName: "Dev Test",
        username: "devtest",
        points: 110,
        predictionsVoted: 1,
        wins: 1,
      },
      {
        rank: 2,
        userId: "00000000-0000-4000-8000-000000000002",
        displayName: "Maya",
        username: "maya",
        points: 100,
        predictionsVoted: 2,
        wins: 1,
      },
      {
        rank: 3,
        userId: "00000000-0000-4000-8000-000000000003",
        displayName: "Sam",
        username: "sam",
        points: 90,
        predictionsVoted: 2,
        wins: 0,
      },
    ];
  }

  const { data: viewerMembership, error: viewerError } = await supabase
    .from("group_members")
    .select("role")
    .eq("group_id", parsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (viewerError) {
    throw new Error(viewerError.message);
  }

  if (!viewerMembership) {
    return [];
  }

  const [
    { data: members, error: membersError },
    { data: ledger, error: ledgerError },
    { data: predictions, error: predictionsError },
  ] = await Promise.all([
    supabase
      .from("group_members")
      .select("user_id")
      .eq("group_id", parsed.data),
    supabase.from("ledger").select("user_id, amount").eq("group_id", parsed.data),
    supabase
      .from("predictions")
      .select("id, status, resolved_option_id")
      .eq("group_id", parsed.data),
  ]);

  if (membersError) {
    throw new Error(membersError.message);
  }

  if (ledgerError) {
    throw new Error(ledgerError.message);
  }

  if (predictionsError) {
    throw new Error(predictionsError.message);
  }

  const predictionIds = predictions?.map((prediction) => prediction.id) ?? [];
  const { data: votes, error: votesError } =
    predictionIds.length > 0
      ? await supabase
          .from("votes")
          .select("prediction_id, option_id, user_id")
          .in("prediction_id", predictionIds)
      : { data: [], error: null };

  if (votesError) {
    throw new Error(votesError.message);
  }

  const profiles = await getProfilesByIds(
    supabase,
    members?.map((member) => member.user_id) ?? [],
  );
  const pointsByUser = new Map<string, number>();
  const votedByUser = new Map<string, Set<string>>();
  const winsByUser = new Map<string, number>();
  const resolvedById = new Map(
    predictions
      ?.filter((prediction) => prediction.status === "resolved")
      .map((prediction) => [prediction.id, prediction.resolved_option_id]) ?? [],
  );

  members?.forEach((member) => {
    pointsByUser.set(member.user_id, 0);
    votedByUser.set(member.user_id, new Set());
    winsByUser.set(member.user_id, 0);
  });

  ledger?.forEach((entry) => {
    pointsByUser.set(
      entry.user_id,
      (pointsByUser.get(entry.user_id) ?? 0) + entry.amount,
    );
  });

  votes?.forEach((vote) => {
    votedByUser.get(vote.user_id)?.add(vote.prediction_id);

    if (resolvedById.get(vote.prediction_id) === vote.option_id) {
      winsByUser.set(vote.user_id, (winsByUser.get(vote.user_id) ?? 0) + 1);
    }
  });

  return (members ?? [])
    .map((member) => {
      const profile = profiles.get(member.user_id);

      return {
        rank: 0,
        userId: member.user_id,
        displayName: profile?.displayName ?? "Unknown player",
        username: profile?.username ?? "unknown",
        points: pointsByUser.get(member.user_id) ?? 0,
        predictionsVoted: votedByUser.get(member.user_id)?.size ?? 0,
        wins: winsByUser.get(member.user_id) ?? 0,
      };
    })
    .sort((a, b) => b.points - a.points || b.wins - a.wins)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}
