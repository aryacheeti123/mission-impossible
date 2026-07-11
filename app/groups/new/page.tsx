import { AppShell } from "@/components/AppShell";
import { CreateGroupForm } from "@/components/CreateGroupForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewGroupPage() {
  return (
    <AppShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Create a group</CardTitle>
            <CardDescription>
              The invite code is generated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateGroupForm />
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
