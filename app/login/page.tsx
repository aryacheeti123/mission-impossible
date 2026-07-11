import { redirect } from "next/navigation";
import { AuthForm } from "@/components/AuthForm";
import { isDevLoginEnabled } from "@/lib/dev-auth";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (!error) {
      redirect("/dashboard");
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl">
        <div className="mb-8 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Private points. Friendly chaos.
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-5xl">
            Mission Impossible
          </h1>
          <p className="mt-3 text-muted-foreground">
            Make bold predictions with friends, vote before the clock runs out,
            and climb the leaderboard with virtual points.
          </p>
        </div>
        <AuthForm showDevLogin={isDevLoginEnabled()} />
      </div>
    </main>
  );
}
