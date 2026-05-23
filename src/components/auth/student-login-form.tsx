"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { postAuth } from "@/lib/auth/client";

export function StudentLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const data = await postAuth("/api/auth/login/student", {
        identifier: String(form.get("identifier") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      router.push(data.redirectTo ?? "/student/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Student sign in"
      description="Use your username or roll number"
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="text-violet-400 hover:underline">
            Create account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          name="identifier"
          label="Username or Roll Number"
          placeholder="atharv_s or JEE-2026-042"
          autoComplete="username"
          required
        />
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          required
        />

        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
    </AuthCard>
  );
}
