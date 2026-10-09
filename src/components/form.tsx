import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

const fieldClass =
  "w-full border border-foreground/30 bg-white px-3 py-3 text-base outline-none focus:border-accent";

export function Field({ label, ...props }: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input {...props} className={fieldClass} />
    </label>
  );
}

export function SelectField({
  label,
  children,
  ...props
}: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <select {...props} className={fieldClass}>
        {children}
      </select>
    </label>
  );
}

export function ErrorText({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="border border-red-700 bg-red-50 px-3 py-2 text-sm text-red-800">
      {message}
    </p>
  );
}

export function SubmitButton({ busy, children }: { busy: boolean; children: React.ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="w-full bg-accent px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
    >
      {busy ? "Please wait…" : children}
    </button>
  );
}
