"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { toApiPhone } from "@/lib/phone";
import { Button, ErrorText, Field, PhoneField } from "./form";

const card = "flex min-w-0 flex-1 basis-[340px] flex-col gap-5 rounded-sm border border-line bg-white p-8";
const heading = "mb-1.5 font-display text-[28px] font-bold tracking-tight";

// Sign in and sign up side by side. The vendor application has its own page, /become-a-vendor.
export default function AuthScreen() {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-12 pb-16">
      <div className="flex flex-wrap items-start gap-6">
        <SignInCard />
        <SignUpCard />
      </div>
    </main>
  );
}

function useSubmit() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };
  return { error, busy, run };
}

function SignInCard() {
  const { signIn } = useAuth();
  const router = useRouter();
  const { error, busy, run } = useSubmit();

  return (
    <section className={card}>
      <div>
        <h1 className={heading}>Sign in</h1>
        <p className="text-sm text-[#45474B]">Welcome back. Track orders and check out faster.</p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          run(async () => {
            await signIn(String(f.get("email")), String(f.get("password")));
            router.push("/");
          });
        }}
      >
        <ErrorText message={error} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        <a href="/forgot-password" className="-mt-2 self-start text-[13px] font-semibold text-accent-ink hover:text-foreground">
          Forgot password?
        </a>
        <Button type="submit" busy={busy}>
          Sign in
        </Button>
      </form>
    </section>
  );
}

function SignUpCard() {
  const { signUp } = useAuth();
  const router = useRouter();
  const { error, busy, run } = useSubmit();

  return (
    <section className={card}>
      <div>
        <h2 className={heading}>Create an account</h2>
        <p className="text-sm text-[#45474B]">Shop from approved vendors across Nigeria.</p>
      </div>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          run(async () => {
            await signUp({
              name: String(f.get("name")),
              email: String(f.get("email")),
              phone: toApiPhone(String(f.get("phone"))),
              password: String(f.get("password")),
            });
            router.push("/");
          });
        }}
      >
        <ErrorText message={error} />
        <Field label="Full name" name="name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <PhoneField label="Phone number" name="phone" required />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          hint="At least 8 characters."
          required
        />
        <Button type="submit" tone="dark" busy={busy}>
          Create account
        </Button>
      </form>
      <p className="text-sm text-[#45474B]">
        Want to sell instead?{" "}
        <a href="/become-a-vendor" className="font-semibold text-accent-ink hover:text-foreground">
          Apply as a vendor
        </a>
      </p>
    </section>
  );
}
