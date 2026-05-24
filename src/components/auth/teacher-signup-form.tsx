"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthCard } from "@/components/auth/auth-card";
import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { postAuth } from "@/lib/auth/client";

const SUBJECTS = ["Physics", "Chemistry", "Maths"] as const;

export function TeacherSignupForm() {
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
      password: String(form.get("password") ?? ""),
      confirmPassword: String(form.get("confirmPassword") ?? ""),
      subject: String(form.get("subject") ?? ""),
      teacherCode: String(form.get("teacherCode") ?? ""),
      experience: String(form.get("experience") ?? ""),
    };

    // Client-side pre-validation
    if (body.password.length < 8) {
      setFieldErrors({ password: "Password must be at least 8 characters" });
      setLoading(false);
      return;
    }
    if (body.password !== body.confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match" });
      setLoading(false);
      return;
    }

    try {
      const data = await postAuth("/api/auth/signup/teacher", body);
      router.push(data.redirectTo ?? "/teacher/dashboard");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Signup failed";
      // Field-level errors come back as "fieldName: message"
      if (message.includes(":")) {
        const colonIdx = message.indexOf(":");
        const field = message.slice(0, colonIdx).trim();
        const msg = message.slice(colonIdx + 1).trim();
        setFieldErrors({ [field]: msg });
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create teacher account"
      description="Set up your faculty profile for the JEE platform"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login/teacher" className="text-violet-400 hover:underline">
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
          placeholder="Dr. Priya Sharma"
          autoComplete="name"
          error={fieldErrors.fullName}
          required
        />
        <FormField
          name="username"
          label="Username"
          placeholder="priya_sharma"
          autoComplete="username"
          hint="Lowercase letters, numbers, underscores only"
          error={fieldErrors.username}
          required
        />

        {/* Subject specialization */}
        <div className="space-y-2">
          <Label htmlFor="subject">Subject Specialization</Label>
          <Select
            id="subject"
            name="subject"
            required
            aria-invalid={!!fieldErrors.subject}
            aria-describedby={fieldErrors.subject ? "subject-error" : undefined}
            defaultValue=""
          >
            <option value="" disabled>
              Select subject…
            </option>
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
          {fieldErrors.subject && (
            <p id="subject-error" className="text-xs text-red-400" role="alert">
              {fieldErrors.subject}
            </p>
          )}
        </div>

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

        {/* Optional fields */}
        <FormField
          name="teacherCode"
          label="Teacher Code"
          placeholder="Optional invite code"
          error={fieldErrors.teacherCode}
          hint="Leave blank if you don't have one"
        />
        <FormField
          name="experience"
          label="Experience"
          placeholder="e.g. 5 years teaching JEE Chemistry"
          error={fieldErrors.experience}
          hint="Optional — up to 200 characters"
          maxLength={200}
        />

        <SubmitButton loading={loading}>Create teacher account</SubmitButton>
      </form>
    </AuthCard>
  );
}
