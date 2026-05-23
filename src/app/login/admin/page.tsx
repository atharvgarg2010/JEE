import { AuthLayout } from "@/components/auth/auth-layout";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata = {
  title: "Admin Login | JEE Tracker",
};

export default function AdminLoginPage() {
  return (
    <AuthLayout
      title="Administration"
      subtitle="Restricted platform access"
    >
      <AdminLoginForm />
    </AuthLayout>
  );
}
