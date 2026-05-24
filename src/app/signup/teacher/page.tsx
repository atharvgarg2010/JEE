import { AuthLayout } from "@/components/auth/auth-layout";
import { TeacherSignupForm } from "@/components/auth/teacher-signup-form";

export const metadata = {
  title: "Teacher Signup | JEE Tracker",
  description: "Create your faculty account to manage batches and track student progress.",
};

export default function TeacherSignupPage() {
  return (
    <AuthLayout
      title="Join as faculty"
      subtitle="Create your teacher account and start managing students"
    >
      <TeacherSignupForm />
    </AuthLayout>
  );
}
