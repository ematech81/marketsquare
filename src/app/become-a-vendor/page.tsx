"use client";

import Link from "next/link";
import { useState } from "react";
import { ErrorText, Field, SelectField, SubmitButton } from "@/components/form";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function BecomeVendorPage() {
  const { user, vendor, token, loading, refresh } = useAuth();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return <main className="mx-auto max-w-xl px-6 py-12">Loading…</main>;

  if (!user) {
    return (
      <Shell>
        <p className="mb-6 text-foreground/70">Sign in or create an account first, then come back to apply.</p>
        <div className="flex gap-3">
          <Link href="/signin" className="border border-foreground px-4 py-3 font-medium">
            Sign in
          </Link>
          <Link href="/signup" className="bg-accent px-4 py-3 font-medium text-white">
            Create account
          </Link>
        </div>
      </Shell>
    );
  }

  if (vendor?.status === "pending") {
    return (
      <Shell>
        <p className="border border-foreground/30 p-4">
          Thanks, we have your application for <strong>{vendor.businessName}</strong>. We will review it and let you
          know once it is approved.
        </p>
      </Shell>
    );
  }

  if (vendor?.status === "approved" || user.role === "vendor") {
    return (
      <Shell>
        <p className="border border-foreground/30 p-4">
          Your vendor account is approved. The vendor dashboard is coming soon.
        </p>
      </Shell>
    );
  }

  if (vendor?.status === "suspended") {
    return (
      <Shell>
        <p className="border border-red-700 bg-red-50 p-4 text-red-800">
          Your vendor account is suspended. Contact Square Market support.
        </p>
      </Shell>
    );
  }

  const resubmitting = vendor?.status === "rejected";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setBusy(true);
    setError("");
    try {
      await api(resubmitting ? "/vendors/me" : "/vendors/apply", {
        method: resubmitting ? "PUT" : "POST",
        token,
        body: {
          businessName: get("businessName"),
          category: get("category"),
          state: get("state"),
          city: get("city"),
          phone: get("phone"),
          rcNumber: get("rcNumber") || undefined,
          idType: get("idType"),
          idNumber: get("idNumber"),
          bank: {
            bankName: get("bankName"),
            accountNumber: get("accountNumber"),
            accountName: get("accountName"),
          },
        },
      });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell>
      {resubmitting && (
        <p className="mb-6 border border-red-700 bg-red-50 p-4 text-sm text-red-800">
          Your last application was not approved: {vendor?.rejectionReason}. Update your details and apply again.
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <ErrorText message={error} />
        <h2 className="pt-2 text-xl font-bold">Your business</h2>
        <Field label="Business name" name="businessName" required />
        <Field label="What do you sell? (category)" name="category" placeholder="Fashion, electronics…" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="State" name="state" required />
          <Field label="City" name="city" required />
        </div>
        <Field label="Business phone" name="phone" type="tel" placeholder="08012345678" required />
        <Field label="CAC / RC number (optional)" name="rcNumber" />

        <h2 className="pt-4 text-xl font-bold">Identity</h2>
        <SelectField label="ID type" name="idType" required defaultValue="">
          <option value="" disabled>
            Choose one
          </option>
          <option value="nin">NIN</option>
          <option value="drivers_license">Driver&apos;s licence</option>
          <option value="passport">International passport</option>
          <option value="voters_card">Voter&apos;s card</option>
        </SelectField>
        <Field label="ID number" name="idNumber" required />

        <h2 className="pt-4 text-xl font-bold">Where we pay you</h2>
        <Field label="Bank name" name="bankName" required />
        <Field
          label="Account number"
          name="accountNumber"
          inputMode="numeric"
          pattern="\d{10}"
          title="10 digits"
          maxLength={10}
          required
        />
        <Field label="Account name" name="accountName" required />

        <SubmitButton busy={busy}>{resubmitting ? "Apply again" : "Submit application"}</SubmitButton>
      </form>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-12">
      <h1 className="mb-2 text-3xl font-bold">Sell on Square Market</h1>
      <p className="mb-8 text-foreground/70">Apply once. We review every vendor before they can list products.</p>
      {children}
    </main>
  );
}
