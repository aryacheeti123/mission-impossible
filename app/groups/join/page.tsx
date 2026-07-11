import { AppShell } from "@/components/AppShell";
import { JoinGroupForm } from "@/components/JoinGroupForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function JoinGroupPage() {
  return (
    <AppShell>
      <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Join a group</CardTitle>
            <CardDescription>Enter the code from a friend.</CardDescription>
          </CardHeader>
          <CardContent>
            <JoinGroupForm />
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}
