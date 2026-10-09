import Link from "next/link";

const linkClass = "text-muted hover:text-foreground";

export default function Footer() {
  return (
    <footer className="mt-auto bg-white print:hidden">
      <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-8 px-6 pt-10 pb-8">
        <div className="flex flex-1 basis-64 flex-col gap-3">
          <span className="flex items-center gap-2.5 font-display text-xl font-bold">
            <span className="inline-block size-3.5 bg-accent" aria-hidden />
            Square Market
          </span>
          <span className="max-w-70 text-sm leading-normal text-muted">
            Products from approved vendors, delivered across Nigeria.
          </span>
        </div>
        <div className="flex flex-wrap gap-12 text-sm">
          <div className="flex flex-col gap-2.5">
            <strong>Shop</strong>
            <Link href="/products" className={linkClass}>
              All products
            </Link>
            <Link href="/orders" className={linkClass}>
              Track an order
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <strong>Sell</strong>
            <Link href="/become-a-vendor" className={linkClass}>
              Become a vendor
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto max-w-[1280px] px-6 py-4 text-[13px] text-muted">© 2026 Square Market</div>
      </div>
    </footer>
  );
}
