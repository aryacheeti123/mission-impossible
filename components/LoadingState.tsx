export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center">
      <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm font-medium text-muted-foreground shadow-sm">
        <span className="h-3 w-3 animate-pulse rounded-full bg-primary" />
        {label}
      </div>
    </div>
  );
}
