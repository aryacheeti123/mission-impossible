import type {
  MemberRole,
  MissionAssignmentStatus,
  MissionCategory,
  MissionDifficulty,
  MissionOutingStatus,
  MissionTemplateSource,
  MissionTemplateStatus,
  PredictionStatus,
} from "@/types/database";

export type ProfileLite = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

export type UserGroup = {
  id: string;
  name: string;
  inviteCode: string;
  role: MemberRole;
  memberCount: number;
  createdAt: string;
};

export type GroupDetail = UserGroup & {
  createdBy: string;
};

export type PredictionOptionView = {
  id: string;
  label: string;
  position: number;
  voteCount: number;
};

export type PredictionSummary = {
  id: string;
  groupId: string;
  title: string;
  description: string | null;
  creator: ProfileLite | null;
  closesAt: string;
  status: PredictionStatus;
  effectiveStatus: PredictionStatus;
  resolvedOutcome: string | null;
  resolvedOptionId: string | null;
  totalVotes: number;
  options: PredictionOptionView[];
  userVoteOptionId: string | null;
  createdAt: string;
};

export type PredictionDetail = PredictionSummary & {
  groupName: string;
  memberRole: MemberRole;
  canResolve: boolean;
  votes: {
    id: string;
    optionId: string;
    userId: string;
    voter: ProfileLite | null;
    createdAt: string;
  }[];
};

export type LeaderboardRow = {
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  points: number;
  predictionsVoted: number;
  wins: number;
};

export type MissionTemplateView = {
  id: string;
  groupId: string;
  createdBy: string | null;
  title: string;
  description: string | null;
  category: MissionCategory;
  difficulty: MissionDifficulty;
  source: MissionTemplateSource;
  status: MissionTemplateStatus;
  safetyNotes: string | null;
  createdAt: string;
};

export type MissionOutingView = {
  id: string;
  groupId: string;
  createdBy: string | null;
  title: string;
  venueType: string | null;
  vibe: string | null;
  startsAt: string | null;
  status: MissionOutingStatus;
  createdAt: string;
};

export type MissionPreferenceView = {
  allowPerformance: boolean;
  allowPhoto: boolean;
  allowTalkingToStrangers: boolean;
  allowDancing: boolean;
  allowDrinkingRelated: boolean;
  maxDifficulty: MissionDifficulty;
};

export type MissionAssignmentView = {
  id: string;
  outingId: string;
  groupId: string;
  userId: string;
  assignee: ProfileLite | null;
  mission: MissionTemplateView | null;
  status: MissionAssignmentStatus;
  assignedAt: string;
  completedAt: string | null;
  verifiedBy: string | null;
  verifier: ProfileLite | null;
  verificationNote: string | null;
  rewardPoints: number;
  canVerify: boolean;
  isOwnAssignment: boolean;
};

export type MissionDashboard = {
  groupId: string;
  canAdmin: boolean;
  activeMissionCount: number;
  pendingMissionCount: number;
  activeMissions: MissionTemplateView[];
  pendingMissions: MissionTemplateView[];
  recentOutings: MissionOutingView[];
};

export type MissionOutingDetail = {
  outing: MissionOutingView;
  groupName: string;
  canAdmin: boolean;
  activeMissionCount: number;
  assignmentCount: number;
  assignments: MissionAssignmentView[];
  userAssignment: MissionAssignmentView | null;
  verificationQueue: MissionAssignmentView[];
};

export type ActionState = {
  error?: string;
  success?: string;
};
