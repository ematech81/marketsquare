"use client";

import Link from "next/link";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button, ErrorText, Field } from "./form";

const card = "mx-auto flex w-full max-w-md flex-col gap-5 rounded-sm border border-line bg-white p-8";

export function ForgotPasswordForm() {
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email"));
    setBusy(true);
    setError("");
    try {
      const res = await api<{ message: string }>("/auth/forgot", { method: "POST", body: { email } });
      setDone(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={card}>
      <div>
        <h1 className="mb-1.5 font-display text-[28px] font-bold tracking-tight">Forgot your password?</h1>
        <p className="text-sm text-[#45474B]">Enter your email and we will send you a link to choose a new one.</p>
      </div>
      {done ? (
        <p role="status" className="rounded-sm border border-line bg-background p-4 text-sm">
          {done}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <ErrorText message={error} />
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          <Button type="submit" busy={busy}>
            Send reset link
          </Button>
        </form>
      )}
      <Link href="/signin" className="text-sm font-semibold text-accent-ink hover:text-foreground">
        Back to sign in
      </Link>
    </section>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password"));
    if (password !== String(f.get("confirm"))) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api("/auth/reset", { method: "POST", body: { token, password } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={card}>
      <h1 className="font-display text-[28px] font-bold tracking-tight">Choose a new password</h1>
      {done ? (
        <>
          <p role="status" className="rounded-sm border border-line bg-background p-4 text-sm">
            Your password has been changed. You can sign in now.
          </p>
          <Link href="/signin" className="inline-flex h-12 items-center justify-center rounded-sm bg-accent font-semibold text-foreground hover:opacity-90">
            Sign in
          </Link>
        </>
      ) : !token ? (
        <ErrorText message="This link is missing its code. Open the link from your email again, or ask for a new one." />
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <ErrorText message={error} />
          <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={8} hint="At least 8 characters." required />
          <Field label="Type it again" name="confirm" type="password" autoComplete="new-password" minLength={8} required />
          <Button type="submit" busy={busy}>
            Change password
          </Button>
        </form>
      )}
    </section>
  );
}
