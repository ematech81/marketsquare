import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/PasswordForms";

export const metadata = { title: "Choose a new password | Square Market", robots: { index: false } };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className="flex-1 px-6 pt-12 pb-16">
      <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
        <Form searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Form({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const token = Array.isArray(sp.token) ? sp.token[0] : sp.token;
  return <ResetPasswordForm token={token ?? ""} />;
}
