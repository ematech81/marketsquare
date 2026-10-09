import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

const control =
  "box-border w-full rounded-sm border border-[#C6C6CB] bg-white px-3.5 text-[15px] outline-none focus:border-accent";

type FieldProps = { label: string; optional?: boolean; hint?: string; compact?: boolean };

const height = (compact?: boolean) => (compact ? "h-11" : "h-12");

export function Field({
  label,
  optional,
  hint,
  compact,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </span>
      <input {...props} className={`${control} ${height(compact)}`} />
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

// Nigerian phone number with a fixed +234 box, as in the design.
export function PhoneField({
  label,
  compact,
  defaultValue,
  ...props
}: { label: string; compact?: boolean } & Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex">
        <span
          className={`box-border inline-flex items-center rounded-l-sm border border-r-0 border-[#C6C6CB] bg-[#F3F4F5] px-3 text-[15px] ${height(compact)}`}
        >
          +234
        </span>
        <input
          {...props}
          type="tel"
          inputMode="numeric"
          defaultValue={defaultValue}
          placeholder="8012345678"
          className={`${control} min-w-0 rounded-l-none ${height(compact)}`}
        />
      </span>
    </label>
  );
}

export function SelectField({
  label,
  compact,
  children,
  ...props
}: { label: string; compact?: boolean } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <select {...props} className={`${control} ${height(compact)}`}>
        {children}
      </select>
    </label>
  );
}

export function ErrorText({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-sm border border-[#B42318] bg-[#FEF3F2] px-3 py-2 text-sm text-[#B42318]">
      {message}
    </p>
  );
}

type ButtonProps = { busy?: boolean; tone?: "accent" | "dark" | "outline" } & React.ButtonHTMLAttributes<HTMLButtonElement>;

const tones = {
  accent: "bg-accent text-foreground",
  dark: "bg-foreground text-white",
  outline: "border border-foreground bg-white text-foreground",
};

export function Button({ busy, tone = "accent", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={busy || props.disabled}
      className={`h-[52px] rounded-sm px-6 text-base font-semibold hover:opacity-90 disabled:opacity-60 ${tones[tone]} ${className}`}
    >
      {busy ? "Please wait…" : children}
    </button>
  );
}

// Kept so older pages that import SubmitButton still work.
export function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" busy={busy} className="w-full">
      {children}
    </Button>
  );
}
