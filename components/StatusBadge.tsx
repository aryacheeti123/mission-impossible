import { Badge } from "@/components/ui/badge";
import type { PredictionStatus } from "@/types/database";

export function StatusBadge({ status }: { status: PredictionStatus }) {
  const variant =
    status === "open"
      ? "success"
      : status === "closed"
        ? "warning"
        : status === "resolved"
          ? "secondary"
          : "danger";

  return <Badge variant={variant}>{status}</Badge>;
}
