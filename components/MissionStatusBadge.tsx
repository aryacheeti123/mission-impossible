import { Badge } from "@/components/ui/badge";

const labels: Record<string, string> = {
  active: "Active",
  pending_review: "Pending review",
  archived: "Archived",
  rejected: "Rejected",
  draft: "Draft",
  completed: "Completed",
  cancelled: "Cancelled",
  assigned: "Assigned",
  verified: "Verified",
  skipped: "Skipped",
  rerolled: "Rerolled",
  manual: "Manual",
  ai_generated: "AI",
};

export function MissionStatusBadge({ status }: { status: string }) {
  const variant =
    status === "active" || status === "verified"
      ? "success"
      : status === "pending_review" ||
          status === "draft" ||
          status === "assigned" ||
          status === "completed"
        ? "warning"
        : status === "rejected" || status === "cancelled"
          ? "danger"
          : "outline";

  return <Badge variant={variant}>{labels[status] ?? status}</Badge>;
}
