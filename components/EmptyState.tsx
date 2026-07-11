import { CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";

type EmptyStateProps = {
  title: string;
  message: string;
  action?: {
    href: string;
    label: string;
  };
};

export function EmptyState({ title, message, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-10 text-center">
      <CircleDashed className="mb-4 h-10 w-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {action ? (
        <Button asChild className="mt-5">
          <a href={action.href}>{action.label}</a>
        </Button>
      ) : null}
    </div>
  );
}
