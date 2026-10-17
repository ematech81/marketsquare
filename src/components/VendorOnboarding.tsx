"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toApiPhone, toLocalPhone } from "@/lib/phone";
import { topLevel } from "@/lib/categoryTree";
import { NIGERIA_STATES } from "@/lib/states";
import { ErrorText, Field, PhoneField, SelectField } from "./form";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3001";
const DRAFT_KEY = "sm_vendor_draft";
const OTHER = "__other__";

type Category = { _id: string; name: string; slug: string; parent?: string | null };

type Values = {
  businessName: string;
  category: string;
  state: string;
  city: string;
  phone: string;
  rcNumber: string;
  idType: string;
  idNumber: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
};

const empty: Values = {
  businessName: "",
  category: "",
  state: "",
  city: "",
  phone: "",
  rcNumber: "",
  idType: "",
  idNumber: "",
  bankName: "",
  accountNumber: "",
  accountName: "",
};

const ID_TYPES: Record<string, string> = {
  nin: "NIN (National Identity Number)",
  drivers_license: "Driver's licence",
  passport: "International passport",
  voters_card: "Voter's card",
};

const BANKS = [
  "Access Bank",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank (FCMB)",
  "Guaranty Trust Bank (GTBank)",
  "Kuda Bank",
  "Moniepoint",
  "OPay",
  "Polaris Bank",
  "Stanbic IBTC Bank",
  "Sterling Bank",
  "United Bank for Africa (UBA)",
  "Union Bank",
  "Wema Bank",
  "Zenith Bank",
];

const STEPS = [
  { name: "Your account", note: "Sign up or sign in" },
  { name: "Your business", note: "Name, place and contact" },
  { name: "Your identity", note: "Government ID" },
  { name: "Payout and review", note: "Bank account, then submit" },
];

const panel = "rounded-sm border border-line bg-white";
const mono = "font-mono text-[11px] tracking-[0.08em] uppercase";

// The vendor application as four steps. It follows the design: a stage bar across the top, one numbered
// section at a time, a side panel with what to have ready, and a bar along the bottom to move between steps.
export default function VendorOnboarding() {
  const { user, vendor, token, loading, refresh, signIn, signUp } = useAuth();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(empty);
  const [agree, setAgree] = useState(false);
  // Shown right under the tick box.
  const [agreeError, setAgreeError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  // True when "Other" is picked, or the saved category is not one in the list.
  const [otherPicked, setOtherPicked] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"signup" | "signin">("signup");

  const resubmitting = vendor?.status === "rejected";
  // A signed-in person has already done step 1.
  const current = user && step === 0 ? 1 : step;

  useEffect(() => {
    api<{ categories: Category[] }>("/categories")
      .then((r) => setCategories(r.categories))
      .catch(() => setCategories([]))
      .finally(() => setCategoriesLoaded(true));
  }, []);

  // Bring back what was typed before a refresh. It lives in this tab only and is cleared on submit.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const saved = sessionStorage.getItem(DRAFT_KEY);
        if (saved) setValues({ ...empty, ...JSON.parse(saved) });
      } catch {
        // storage can be blocked or hold something unreadable
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // A rejected applicant starts from what they sent before.
  useEffect(() => {
    if (!resubmitting || !token) return;
    api<{ vendor: Values & { bank: { bankName: string; accountNumber: string; accountName: string } } }>("/vendors/me", { token })
      .then(({ vendor: v }) =>
        setValues({
          businessName: v.businessName,
          category: v.category,
          state: v.state,
          city: v.city,
          phone: toLocalPhone(v.phone),
          rcNumber: v.rcNumber ?? "",
          idType: v.idType,
          idNumber: v.idNumber,
          bankName: v.bank.bankName,
          accountNumber: v.bank.accountNumber,
          accountName: v.bank.accountName,
        }),
      )
      .catch(() => undefined);
  }, [resubmitting, token]);

  const typedCategory = otherPicked || (categoriesLoaded && values.category !== "" && !categories.some((c) => c.name === values.category));

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const next = { ...values, [k]: e.target.value };
    setValues(next);
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const go = (n: number) => {
    setError("");
    setStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await api(resubmitting ? "/vendors/me" : "/vendors/apply", {
        method: resubmitting ? "PUT" : "POST",
        token,
        body: {
          businessName: values.businessName.trim(),
          category: values.category,
          state: values.state,
          city: values.city.trim(),
          phone: toApiPhone(values.phone),
          rcNumber: values.rcNumber.trim() || undefined,
          idType: values.idType,
          idNumber: values.idNumber.trim(),
          bank: {
            bankName: values.bankName.trim(),
            accountNumber: values.accountNumber.trim(),
            accountName: values.accountName.trim(),
          },
        },
      });
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      await refresh();
      window.scrollTo({ top: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const title = (
    <div className="border-b border-line bg-white">
      <div className="mx-auto max-w-[1280px] px-4 py-5 md:px-6">
        <nav aria-label="Breadcrumb" className={`${mono} mb-1 text-muted`}>
          <Link href="/" className="hover:text-foreground">
            Square Market
          </Link>{" "}
          / <span className="text-foreground">Sell with us</span>
        </nav>
        <h1 className="font-display text-[28px] font-semibold tracking-tight md:text-[32px]">Apply to sell on Square Market</h1>
        <p className="mt-1 max-w-2xl text-[15px] text-[#45474B]">
          We check every application before you can list products. It takes about five minutes.
        </p>
      </div>
    </div>
  );

  const message = (body: React.ReactNode) => (
    <>
      {title}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-6">
        <div className={`${panel} max-w-2xl border-t-4 border-t-accent p-6 text-[15px] leading-relaxed`}>{body}</div>
      </main>
    </>
  );

  if (loading) return message(<span className="text-muted">Loading…</span>);

  if (vendor?.status === "pending") {
    return message(
      <>
        <p className={`${mono} mb-2 text-accent-ink`}>Application received</p>
        <h2 className="mb-2 font-display text-2xl font-semibold">Thanks, we have your application</h2>
        <p>
          We are reviewing <strong>{vendor.businessName}</strong>. We will let you know once it is approved, and then you
          can list products from your vendor dashboard.
        </p>
        <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-sm border border-foreground px-5 text-sm font-semibold hover:bg-surface">
          Back to the shop
        </Link>
      </>,
    );
  }

  if (vendor?.status === "approved" || user?.role === "vendor") {
    return message(
      <>
        <h2 className="mb-2 font-display text-2xl font-semibold">Your vendor account is approved</h2>
        <p className="mb-5">Open your vendor dashboard to list products and manage orders.</p>
        <a href={DASHBOARD_URL} className="inline-flex min-h-11 items-center rounded-sm bg-accent px-5 text-sm font-semibold text-foreground hover:brightness-95">
          Open vendor dashboard
        </a>
      </>,
    );
  }

  if (vendor?.status === "suspended") {
    return message(<ErrorText message="Your vendor account is suspended. Contact Square Market support." />);
  }

  if (user?.role === "admin") {
    return message("You are signed in as an admin. Add your own products in the dashboard.");
  }

  const stageBar = (
    <nav aria-label="Application progress" className="overflow-x-auto border-b border-line bg-surface">
      <ol className="mx-auto grid min-w-[640px] max-w-[1280px] grid-cols-4 divide-x divide-line px-4 md:px-6">
        {STEPS.map((s, i) => {
          const done = i < current || (i === 0 && !!user);
          const active = i === current;
          return (
            <li
              key={s.name}
              aria-current={active ? "step" : undefined}
              className={`flex items-start gap-3 px-4 py-3.5 ${active ? "border-b-2 border-accent bg-[#F3F4F5]" : done ? "bg-white" : "opacity-70"}`}
            >
              <span
                className={`mt-0.5 flex size-5 shrink-0 items-center justify-center text-[11px] font-bold ${done ? "bg-foreground text-white" : active ? "bg-accent text-foreground" : "border border-[#76777B] text-[#76777B]"}`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span className="flex flex-col">
                <span className={`${mono} text-[10px] ${active ? "font-bold text-accent-ink" : "text-muted"}`}>
                  Step {i + 1}
                  {done ? " · done" : active ? " · now" : ""}
                </span>
                <span className="text-[13px] font-semibold">{s.name}</span>
                <span className="text-[12px] text-muted">{s.note}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );

  const heading = (n: string, text: string, tag?: string) => (
    <div className="mb-6 flex items-center justify-between gap-3 border-b border-line pb-3">
      <h2 className="flex items-baseline gap-2 font-display text-xl font-semibold tracking-tight uppercase">
        <span className="font-mono text-sm text-accent-ink">{n}</span>
        {text}
      </h2>
      {tag && <span className={`${mono} hidden border border-line bg-[#F3F4F5] px-2 py-0.5 text-[10px] sm:inline`}>{tag}</span>}
    </div>
  );

  const review = (label: string, value: string, jump: number) => (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2.5 text-[14px] last:border-0">
      <span className="text-muted">{label}</span>
      <span className="flex items-start gap-3 text-right font-medium">
        <span className="break-words">{value || "—"}</span>
        <button type="button" onClick={() => go(jump)} className="shrink-0 cursor-pointer text-[13px] font-semibold text-accent-ink underline">
          Edit
        </button>
      </span>
    </div>
  );

  // One form per step. The browser checks the required fields when Continue is pressed.
  const stepForm = (onNext: () => void, body: React.ReactNode, last?: boolean) => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <div className={`${panel} p-5 md:p-6`}>{body}</div>

      <div className="sticky bottom-0 z-30 -mx-4 mt-6 flex items-center justify-between gap-3 border-t border-line bg-white px-4 py-3 md:mx-0 md:border md:px-5">
        <span className={`${mono} hidden items-center gap-2 text-muted sm:flex`}>
          <span className="size-2 rounded-full bg-[#16A34A]" aria-hidden />
          Saved on this device as you type
        </span>
        <div className="ml-auto flex items-center gap-3">
          {current > (user ? 1 : 0) && (
            <button type="button" onClick={() => go(current - 1)} className="min-h-11 cursor-pointer px-3 text-sm font-semibold text-[#45474B] hover:text-foreground">
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={busy}
            className={`min-h-11 cursor-pointer rounded-sm px-6 text-sm font-semibold disabled:opacity-60 ${last ? "bg-accent text-foreground hover:brightness-95" : "bg-foreground text-white hover:opacity-90"}`}
          >
            {last ? (busy ? "Please wait…" : resubmitting ? "Apply again" : "Submit application") : `Continue to step ${current + 2}`}
          </button>
        </div>
      </div>
    </form>
  );

  let content: React.ReactNode;

  if (current === 0) {
    content = (
      <div className={`${panel} p-5 md:p-6`}>
        {heading("01.", mode === "signup" ? "Create your account" : "Sign in")}
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              if (mode === "signup") {
                await signUp({
                  name: String(f.get("name")),
                  email: String(f.get("email")),
                  phone: toApiPhone(String(f.get("phone"))),
                  password: String(f.get("password")),
                });
              } else {
                await signIn(String(f.get("email")), String(f.get("password")));
              }
              setStep(1);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Something went wrong");
            } finally {
              setBusy(false);
            }
          }}
        >
          <ErrorText message={error} />
          {mode === "signup" && <Field label="Full name" name="name" autoComplete="name" required />}
          <Field label="Email" name="email" type="email" autoComplete="email" required />
          {mode === "signup" && <PhoneField label="Phone number" name="phone" required />}
          <Field
            label="Password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={mode === "signup" ? 8 : undefined}
            hint={mode === "signup" ? "At least 8 characters." : undefined}
            required
          />
          <button type="submit" disabled={busy} className="h-12 cursor-pointer rounded-sm bg-foreground px-6 text-[15px] font-semibold text-white hover:opacity-90 disabled:opacity-60">
            {busy ? "Please wait…" : mode === "signup" ? "Create account and continue" : "Sign in and continue"}
          </button>
        </form>
        <p className="mt-4 text-sm text-[#45474B]">
          {mode === "signup" ? "Already have an account? " : "New to Square Market? "}
          <button
            type="button"
            onClick={() => {
              setError("");
              setMode(mode === "signup" ? "signin" : "signup");
            }}
            className="cursor-pointer font-semibold text-accent-ink underline"
          >
            {mode === "signup" ? "Sign in" : "Create an account"}
          </button>
        </p>
      </div>
    );
  } else if (current === 1) {
    content = stepForm(
      () => go(2),
      <>
        {heading("02.", "Your business", "Step 2 of 4")}
        {resubmitting && (
          <div className="mb-5">
            <ErrorText message={`Your last application was not approved: ${vendor?.rejectionReason}. Update your details and apply again.`} />
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Business name" name="businessName" value={values.businessName} onChange={set("businessName")} maxLength={80} hint="The name customers see on your products." required />
          </div>
          <div className="flex flex-col gap-3">
            <SelectField
              label="What do you sell?"
              name="category"
              value={typedCategory ? OTHER : values.category}
              onChange={(e) => {
                if (e.target.value === OTHER) {
                  setOtherPicked(true);
                  set("category")({ target: { value: "" } } as React.ChangeEvent<HTMLInputElement>);
                } else {
                  setOtherPicked(false);
                  set("category")(e);
                }
              }}
              required
            >
              <option value="" disabled>
                Choose a category
              </option>
              {topLevel(categories).map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
              <option value={OTHER}>Other: my category is not listed</option>
            </SelectField>
            {typedCategory && (
              <Field
                label="Your category"
                name="newCategory"
                value={values.category}
                onChange={set("category")}
                minLength={2}
                maxLength={40}
                placeholder="e.g. Baby care"
                hint="It is added to the list for everyone on Square Market."
                required
              />
            )}
          </div>
          <PhoneField label="Business phone" name="phone" value={values.phone} onChange={set("phone")} required />
          <SelectField label="State" name="state" value={values.state} onChange={set("state")} required>
            <option value="" disabled>
              Choose your state
            </option>
            {NIGERIA_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectField>
          <Field label="City" name="city" value={values.city} onChange={set("city")} required />
          <div className="md:col-span-2">
            <Field label="CAC registration number" name="rcNumber" value={values.rcNumber} onChange={set("rcNumber")} optional hint="Leave empty if you sell as an individual." />
          </div>
        </div>
      </>,
    );
  } else if (current === 2) {
    content = stepForm(
      () => go(3),
      <>
        {heading("03.", "Your identity", "Step 3 of 4")}
        <div className="grid gap-5 md:grid-cols-2">
          <SelectField label="Government ID type" name="idType" value={values.idType} onChange={set("idType")} required>
            <option value="" disabled>
              Choose one
            </option>
            {Object.entries(ID_TYPES).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </SelectField>
          <Field
            label="ID number"
            name="idNumber"
            value={values.idNumber}
            onChange={(e) => set("idNumber")(values.idType === "nin" ? ({ target: { value: e.target.value.replace(/\D/g, "") } } as React.ChangeEvent<HTMLInputElement>) : e)}
            autoComplete="off"
            inputMode={values.idType === "nin" ? "numeric" : "text"}
            maxLength={values.idType === "nin" ? 11 : 20}
            pattern={values.idType === "nin" ? "\\d{11}" : "[A-Za-z0-9 \\-]{6,20}"}
            title={values.idType === "nin" ? "A NIN is exactly 11 digits" : "6 to 20 letters and numbers"}
            hint={values.idType === "nin" ? "Your NIN is exactly 11 digits." : "Copy it exactly as printed on the ID."}
            required
          />
        </div>
        <p className="mt-5 text-[13px] text-muted">
          We use this only to confirm who you are before approving your account. It is not shown to customers.
        </p>
      </>,
    );
  } else {
    content = stepForm(
      () => {
        if (!agree) {
          setAgreeError("Tick the box to confirm your details are correct.");
          return;
        }
        submit();
      },
      <>
        {heading("04.", "Payout and review", "Step 4 of 4")}
        <p className="mb-4 text-[14px] text-[#45474B]">We pay your earnings into this account. The account name must match your name or business name.</p>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Field label="Bank name" name="bankName" list="banks" value={values.bankName} onChange={set("bankName")} autoComplete="off" required />
            <datalist id="banks">
              {BANKS.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
          <Field
            label="Account number"
            name="accountNumber"
            inputMode="numeric"
            pattern="\d{10}"
            title="10 digits"
            maxLength={10}
            value={values.accountNumber}
            onChange={set("accountNumber")}
            hint="10 digits."
            required
          />
          <Field label="Account name" name="accountName" value={values.accountName} onChange={set("accountName")} required />
        </div>

        <h3 className="mt-8 mb-1 font-display text-lg font-semibold">Check your details</h3>
        <div className="rounded-sm border border-line px-4">
          {review("Business", values.businessName, 1)}
          {review("Sells", values.category, 1)}
          {review("Location", [values.city, values.state].filter(Boolean).join(", "), 1)}
          {review("Phone", values.phone ? `+234${values.phone.replace(/^0/, "")}` : "", 1)}
          {review("CAC number", values.rcNumber || "None", 1)}
          {review("ID", values.idType ? `${ID_TYPES[values.idType]} · ${values.idNumber}` : "", 2)}
        </div>

        <label className="mt-5 flex items-start gap-3 text-sm">
          <input type="checkbox" checked={agree} onChange={(e) => {
              setAgree(e.target.checked);
              if (e.target.checked) setAgreeError("");
            }}
            aria-describedby={agreeError ? "agree-error" : undefined}
            className="mt-0.5 size-[18px] accent-accent"
          />
          <span>
            I confirm these details are correct and I agree to the{" "}
            <Link href="/terms" target="_blank" className="font-semibold text-accent-ink underline">
              terms
            </Link>
            .
          </span>
        </label>
        {agreeError && (
          <p id="agree-error" role="alert" className="mt-2 text-sm text-[#B42318]">
            {agreeError}
          </p>
        )}
      </>,
      true,
    );
  }

  return (
    <>
      {title}
      {stageBar}
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 md:px-6">
        <div className="grid items-start gap-8 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            {current !== 0 && error && (
              <div className="mb-4">
                <ErrorText message={error} />
              </div>
            )}
            {content}
          </div>

          <aside className="flex flex-col gap-6 lg:col-span-4">
            <section className={`${panel} p-5`}>
              <h3 className={`${mono} mb-3 border-b border-line pb-2.5 font-semibold`}>Have these ready</h3>
              <ul className="flex flex-col gap-2.5 text-[14px] text-[#45474B]">
                <li>Your business name and a phone number customers can reach.</li>
                <li>A government ID: NIN, driver&apos;s licence, passport or voter&apos;s card.</li>
                <li>A Nigerian bank account for payouts.</li>
                <li>Your CAC number, if your business is registered.</li>
              </ul>
            </section>

            <section className={`${panel} p-5`}>
              <h3 className={`${mono} mb-3 border-b border-line pb-2.5 font-semibold`}>What happens next</h3>
              <ol className="flex flex-col gap-3 text-[14px] text-[#45474B]">
                {[
                  "We review your application.",
                  "You get an email and a text when it is approved.",
                  "You list products from your vendor dashboard.",
                  "When an order is delivered, the money goes to your wallet and you request a payout.",
                ].map((t, i) => (
                  <li key={t} className="flex gap-3">
                    <span className="flex size-5 shrink-0 items-center justify-center bg-foreground text-[11px] font-bold text-white">{i + 1}</span>
                    {t}
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
