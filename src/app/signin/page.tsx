"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorText, Field, SubmitButton } from "@/components/form";
import { useAuth } from "@/lib/auth";

export default function SignInPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await signIn(String(form.get("email")), String(form.get("password")));
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorText message={error} />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-foreground/70">
        New to Square Market?{" "}
        <Link href="/signup" className="text-accent underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
