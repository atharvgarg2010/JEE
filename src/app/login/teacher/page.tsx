import { AuthLayout } from "@/components/auth/auth-layout";
import { TeacherLoginForm } from "@/components/auth/teacher-login-form";

export const metadata = {
  title: "Teacher Login | JEE Tracker",
};

export default function TeacherLoginPage() {
  return (
    <AuthLayout
      title="Faculty portal"
      subtitle="Manage batches and track student progress"
    >
      <TeacherLoginForm />
    </AuthLayout>
  );
}
