"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toApiPhone } from "@/lib/phone";
import { NIGERIA_STATES } from "@/lib/states";
import { Button, ErrorText, Field, PhoneField, SelectField } from "./form";

const card = "flex min-w-0 flex-1 basis-[340px] flex-col gap-5 rounded-sm border border-line bg-white p-8";
const heading = "mb-1.5 font-display text-[28px] font-bold tracking-tight";

type Category = { _id: string; name: string };

// The design shows sign in, sign up and the vendor application on one screen.
export default function AuthScreen() {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-12 pb-16">
      <div className="flex flex-wrap items-start gap-6">
        <SignInCard />
        <SignUpCard />
        <VendorCard />
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
        <a href="#vendor" className="font-semibold text-accent-ink hover:text-foreground">
          Apply as a vendor
        </a>
      </p>
    </section>
  );
}

function VendorCard() {
  const { user, vendor, token, loading, refresh } = useAuth();
  const { error, busy, run } = useSubmit();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api<{ categories: Category[] }>("/categories")
      .then((r) => setCategories(r.categories))
      .catch(() => setCategories([]));
  }, []);

  const resubmitting = vendor?.status === "rejected";
  const shell = `${card} border-t-4 border-t-accent`;

  const title = (
    <div id="vendor">
      <h2 className={heading}>Vendor application</h2>
      <p className="text-sm text-[#45474B]">
        We review every application before you can list products. Your application will show here once you apply.
      </p>
    </div>
  );

  if (loading) return <section className={shell}>{title}</section>;

  if (!user) {
    return (
      <section className={shell}>
        {title}
        <p className="rounded-sm border border-line bg-[#F8F9FA] p-4 text-sm">
          Create an account or sign in first, then fill in this form.
        </p>
      </section>
    );
  }

  if (vendor?.status === "pending") {
    return (
      <section className={shell}>
        {title}
        <p className="rounded-sm border border-line bg-[#F8F9FA] p-4 text-sm">
          Thanks, we have your application for <strong>{vendor.businessName}</strong>. We will review it and let you
          know once it is approved.
        </p>
      </section>
    );
  }

  if (vendor?.status === "approved" || user.role === "vendor") {
    return (
      <section className={shell}>
        {title}
        <p className="rounded-sm border border-line bg-[#F8F9FA] p-4 text-sm">
          Your vendor account is approved.{" "}
          <a href={process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001"} className="font-semibold text-accent-ink underline">
            Open your vendor dashboard
          </a>{" "}
          to list products and manage orders.
        </p>
      </section>
    );
  }

  if (vendor?.status === "suspended") {
    return (
      <section className={shell}>
        {title}
        <ErrorText message="Your vendor account is suspended. Contact Square Market support." />
      </section>
    );
  }

  if (user.role === "admin") {
    return (
      <section className={shell}>
        {title}
        <p className="rounded-sm border border-line bg-[#F8F9FA] p-4 text-sm">
          You are signed in as an admin. Add your own products in the dashboard.
        </p>
      </section>
    );
  }

  return (
    <section className={shell}>
      {title}
      {resubmitting && <ErrorText message={`Your last application was not approved: ${vendor?.rejectionReason}. Update your details and apply again.`} />}
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          const get = (k: string) => String(f.get(k) ?? "");
          run(async () => {
            await api(resubmitting ? "/vendors/me" : "/vendors/apply", {
              method: resubmitting ? "PUT" : "POST",
              token,
              body: {
                businessName: get("businessName"),
                category: get("category"),
                state: get("state"),
                city: get("city"),
                phone: toApiPhone(get("phone")),
                rcNumber: get("rcNumber") || undefined,
                idType: get("idType"),
                idNumber: get("idNumber"),
                bank: { bankName: get("bankName"), accountNumber: get("accountNumber"), accountName: get("accountName") },
              },
            });
            await refresh();
          });
        }}
      >
        <ErrorText message={error} />
        <Field label="Business name" name="businessName" required />
        <SelectField label="What do you sell?" name="category" defaultValue="" required>
          <option value="" disabled>
            Choose a category
          </option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>
              {c.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="State" name="state" defaultValue="" required>
          <option value="" disabled>
            Choose your state
          </option>
          {NIGERIA_STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </SelectField>
        <Field label="City" name="city" required />
        <PhoneField label="Business phone" name="phone" required />
        <Field label="CAC registration number" name="rcNumber" optional />
        <SelectField label="Government ID type" name="idType" defaultValue="" required>
          <option value="" disabled>
            Choose one
          </option>
          <option value="nin">NIN</option>
          <option value="drivers_license">Driver&apos;s licence</option>
          <option value="passport">International passport</option>
          <option value="voters_card">Voter&apos;s card</option>
        </SelectField>
        <Field label="ID number" name="idNumber" required />
        <Field label="Bank name (for payouts)" name="bankName" required />
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
        <Button type="submit" busy={busy}>
          {resubmitting ? "Apply again" : "Submit application"}
        </Button>
      </form>
    </section>
  );
}
