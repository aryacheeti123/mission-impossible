import { notFound } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { CreatePredictionForm } from "@/components/CreatePredictionForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getGroupDetail } from "@/lib/actions/groups";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

export default async function NewPredictionPage({ params }: PageProps) {
  const { groupId } = await params;
  const group = await getGroupDetail(groupId);

  if (!group) {
    notFound();
  }

  return (
    <AppShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>New prediction</CardTitle>
            <CardDescription>{group.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <CreatePredictionForm groupId={group.id} />
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
