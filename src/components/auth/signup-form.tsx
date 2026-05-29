"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { postAuth } from "@/lib/auth/client";

export function SignupForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFieldErrors({});

    const form = new FormData(e.currentTarget);
    const body = {
      fullName: String(form.get("fullName") ?? ""),
      username: String(form.get("username") ?? "").toLowerCase(),
      rollNumber: String(form.get("rollNumber") ?? ""),
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
    };

    try {
      const data = await postAuth("/api/auth/signup", body);
      router.push(data.redirectTo ?? "/student/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      if (message.includes(":")) {
        const [field, ...rest] = message.split(":");
        setFieldErrors({ [field.trim()]: rest.join(":").trim() });
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create student account"
      description="Create your account to start tracking JEE prep"
      footer={
        <>
          Already registered?{" "}
          <Link href="/login/student" className="text-violet-400 hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && !Object.keys(fieldErrors).length && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField
          name="fullName"
          label="Full Name"
          placeholder="Atharv Sharma"
          autoComplete="name"
          error={fieldErrors.fullName}
          required
        />
        <FormField
          name="username"
          label="Username"
          placeholder="atharv_s"
          autoComplete="username"
          hint="Lowercase letters, numbers, underscores only"
          error={fieldErrors.username}
          required
        />
        <FormField
          name="rollNumber"
          label="Roll Number"
          placeholder="JEE-2026-042"
          error={fieldErrors.rollNumber}
          required
        />

        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="Min 8 chars with uppercase, lowercase, and a number"
          error={fieldErrors.password}
          required
        />
        <FormField
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
          required
        />

        <SubmitButton loading={loading}>Create account</SubmitButton>
      </form>
    </AuthCard>
  );
}
