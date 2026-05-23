import { AuthLayout } from "@/components/auth/auth-layout";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Student Signup | JEE Tracker",
};

export default function SignupPage() {
  return (
    <AuthLayout
      title="Start your journey"
      subtitle="Create your student account in minutes"
    >
      <SignupForm />
    </AuthLayout>
  );
}
