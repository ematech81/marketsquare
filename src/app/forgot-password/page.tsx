import { ForgotPasswordForm } from "@/components/PasswordForms";

export const metadata = { title: "Forgot password | Square Market" };

export default function Page() {
  return (
    <main className="flex-1 px-6 pt-12 pb-16">
      <ForgotPasswordForm />
    </main>
  );
}
