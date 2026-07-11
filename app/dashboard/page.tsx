import Link from "next/link";
import { DoorOpen, Plus, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUserGroups } from "@/lib/actions/groups";

export default async function DashboardPage() {
  const groups = await getUserGroups();

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Your friend groups and prediction boards.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/groups/join">
                <DoorOpen className="h-4 w-4" />
                Join
              </Link>
            </Button>
            <Button asChild>
              <Link href="/groups/new">
                <Plus className="h-4 w-4" />
                New group
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-8">
          {groups.length === 0 ? (
            <EmptyState
              title="No groups yet"
              message="Create one for your friends or join with an invite code."
              action={{ href: "/groups/new", label: "Create group" }}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {groups.map((group) => (
                <Card key={group.id}>
                  <CardHeader>
                    <CardTitle>{group.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Invite {group.inviteCode}
                    </p>
                  </CardHeader>
                  <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    {group.memberCount} members
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full">
                      <Link href={`/groups/${group.id}`}>Open group</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
