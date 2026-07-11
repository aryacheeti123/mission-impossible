import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { MissionPreferenceForm } from "@/components/MissionPreferenceForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGroupDetail } from "@/lib/actions/groups";
import { getMissionPreferences } from "@/lib/actions/missions";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function MissionPreferencesPage({ params }: PageProps) {
  const { groupId } = await params;
  const group = await getGroupDetail(groupId);

  if (!group) {
    notFound();
  }

  const preferences = await getMissionPreferences(groupId);

  if (!preferences) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Mission preferences</CardTitle>
            <CardDescription>{group.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <MissionPreferenceForm
              groupId={group.id}
              preferences={preferences}
            />
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
