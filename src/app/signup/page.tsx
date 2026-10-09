"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ErrorText, Field, SubmitButton } from "@/components/form";
import { useAuth } from "@/lib/auth";

export default function SignUpPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      await signUp({
        name: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
        password: String(form.get("password")),
      });
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-12">
      <h1 className="mb-6 text-3xl font-bold">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorText message={error} />
        <Field label="Full name" name="name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Phone number" name="phone" type="tel" autoComplete="tel" placeholder="08012345678" required />
        <Field
          label="Password (at least 8 characters)"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <SubmitButton busy={busy}>Create account</SubmitButton>
      </form>
      <p className="mt-6 text-sm text-foreground/70">
        Already have an account?{" "}
        <Link href="/signin" className="text-accent underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
