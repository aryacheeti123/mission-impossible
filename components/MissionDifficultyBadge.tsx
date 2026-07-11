import { Badge } from "@/components/ui/badge";
import type { MissionDifficulty } from "@/types/database";

const labels: Record<MissionDifficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  chaotic_safe: "Chaotic safe",
};

export function MissionDifficultyBadge({
  difficulty,
}: {
  difficulty: MissionDifficulty;
}) {
  const variant =
    difficulty === "easy"
      ? "success"
      : difficulty === "medium"
        ? "warning"
        : difficulty === "hard"
          ? "danger"
          : "default";

  return <Badge variant={variant}>{labels[difficulty]}</Badge>;
}
