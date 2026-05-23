import { AuthLayout } from "@/components/auth/auth-layout";
import { StudentLoginForm } from "@/components/auth/student-login-form";

export const metadata = {
  title: "Student Login | JEE Tracker",
};

export default function StudentLoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your student dashboard"
    >
      <StudentLoginForm />
    </AuthLayout>
  );
}
