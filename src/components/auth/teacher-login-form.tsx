"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { postAuth } from "@/lib/auth/client";

export function TeacherLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const data = await postAuth("/api/auth/login/teacher", {
        username: String(form.get("username") ?? "").toLowerCase(),
        password: String(form.get("password") ?? ""),
      });
      router.push(data.redirectTo ?? "/teacher/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Teacher sign in"
      description="Faculty access for batch management"
      footer={
        <div className="flex flex-col gap-1.5">
          <span>
            Don&apos;t have an account?{" "}
            <Link href="/signup/teacher" className="text-violet-400 hover:underline">
              Sign up
            </Link>
          </span>
          <span>
            <Link href="/login/student" className="text-violet-400 hover:underline">
              Student login instead
            </Link>
          </span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          name="username"
          label="Username"
          placeholder="faculty_patel"
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
