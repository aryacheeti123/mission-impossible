"use client";

import { useActionState } from "react";
import { LogIn, UserPlus } from "lucide-react";
import { devSignIn, signIn, signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState = { error: "", success: "" };

export function AuthForm({ showDevLogin = false }: { showDevLogin?: boolean }) {
  const [loginState, loginAction, loginPending] = useActionState(
    signIn,
    initialState,
  );
  const [signupState, signupAction, signupPending] = useActionState(
    signUp,
    initialState,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Log in</CardTitle>
          <CardDescription>Use your email and password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
            {loginState.error ? (
              <p className="text-sm font-medium text-destructive">
                {loginState.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={loginPending}>
              <LogIn className="h-4 w-4" />
              {loginPending ? "Logging in" : "Log in"}
            </Button>
          </form>
          {showDevLogin ? (
            <form action={devSignIn} className="mt-3">
              <Button type="submit" variant="secondary" className="w-full">
                Continue as Dev Test
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create account</CardTitle>
          <CardDescription>Pick the name friends will see.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signupAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-display-name">Display name</Label>
              <Input
                id="signup-display-name"
                name="displayName"
                minLength={2}
                maxLength={60}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                name="username"
                minLength={3}
                maxLength={30}
                pattern="[A-Za-z0-9_]+"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                name="password"
                type="password"
                minLength={6}
                required
              />
            </div>
            {signupState.error ? (
              <p className="text-sm font-medium text-destructive">
                {signupState.error}
              </p>
            ) : null}
            {signupState.success ? (
              <p className="text-sm font-medium text-primary">
                {signupState.success}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={signupPending}>
              <UserPlus className="h-4 w-4" />
              {signupPending ? "Creating" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
