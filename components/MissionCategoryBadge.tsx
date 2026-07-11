import { Badge } from "@/components/ui/badge";
import type { MissionCategory } from "@/types/database";

const labels: Record<MissionCategory, string> = {
  social: "Social",
  observation: "Observation",
  photo: "Photo",
  performance: "Performance",
  team: "Team",
  low_key: "Low key",
  wildcard: "Wildcard",
};

export function MissionCategoryBadge({ category }: { category: MissionCategory }) {
  return <Badge variant="outline">{labels[category]}</Badge>;
}
