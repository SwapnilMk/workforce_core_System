import ForgotPasswordViewPage from "@/features/auth/components/forgot-password-view";

export const metadata = {
  title: "Authentication | Forgot Password",
  description: "Request a password reset link for your organization account",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordViewPage />;
}
