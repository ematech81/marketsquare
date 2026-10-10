import { Suspense } from "react";

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

// Shared look for the plain-text pages (delivery and returns, terms, privacy).
export function PolicyPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 pt-10 pb-16">
      <h1 className="mb-6 text-4xl font-bold tracking-[-0.02em]">{title}</h1>
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <div className="flex flex-col gap-5 text-[15px] leading-relaxed text-[#45474B]">{children}</div>
      </Suspense>
    </main>
  );
}

export const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-4 font-display text-xl font-semibold text-foreground">{children}</h2>
);

export function Contact() {
  return (
    <p>
      Questions? {SUPPORT_EMAIL ? <>Email us at <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-accent-ink underline">{SUPPORT_EMAIL}</a>.</> : "Contact us using the details in your order email."}
    </p>
  );
}
