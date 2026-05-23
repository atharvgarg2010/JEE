"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { postAuth } from "@/lib/auth/client";

export function AdminLoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      const data = await postAuth("/api/auth/login/admin", {
        username: String(form.get("username") ?? "").toLowerCase(),
        password: String(form.get("password") ?? ""),
      });
      router.push(data.redirectTo ?? "/admin/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Admin sign in" description="Platform administrator access">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormField name="username" label="Username" required />
        <FormField name="password" label="Password" type="password" required />
        <SubmitButton loading={loading}>Sign in</SubmitButton>
      </form>
    </AuthCard>
  );
}
