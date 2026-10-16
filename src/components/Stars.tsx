// Five stars, filled to the average rating (4.5 fills four and a half). The number is read out for screen readers.
export default function Stars({ value, size = 16 }: { value: number; size?: number }) {
  const percent = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <span role="img" aria-label={`${value.toFixed(1)} out of 5 stars`} className="relative inline-block leading-none whitespace-nowrap" style={{ fontSize: size }}>
      <span className="text-[#D8DADE]" aria-hidden>
        ★★★★★
      </span>
      <span className="absolute inset-y-0 left-0 overflow-hidden text-[#F59E0B]" style={{ width: `${percent}%` }} aria-hidden>
        ★★★★★
      </span>
    </span>
  );
}
