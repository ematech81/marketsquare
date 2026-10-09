// The forms show a fixed "+234" box, so people type the rest: 8031234567 or 08031234567.
export function toApiPhone(typed: string): string {
  const digits = typed.replace(/\D/g, "");
  const local = digits.startsWith("234") ? digits.slice(3) : digits.replace(/^0/, "");
  return `+234${local}`;
}

// Turns a stored number back into what goes after the "+234" box.
export function toLocalPhone(stored: string): string {
  return stored.replace(/^\+234/, "").replace(/^0/, "");
}
