// A slim bar across the top of every page, on phones and large screens. The number is a tap-to-call link.
export default function WholesaleBar() {
  return (
    <a
      href="tel:+2349011495230"
      className="block w-full bg-accent px-3 py-2 text-center text-[13px] leading-snug font-semibold text-foreground hover:brightness-95"
    >
      Call this number 09011495230 for wholesales supply
    </a>
  );
}
