import { Suspense } from "react";
import Invoice from "@/components/Invoice";

type Params = Promise<{ orderNumber: string }>;

export const metadata = { title: "Invoice | Square Market", robots: { index: false } };

export default function Page({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-8 pb-14 print:p-0">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Content params={params} />
      </Suspense>
    </main>
  );
}

async function Content({ params }: { params: Params }) {
  const { orderNumber } = await params;
  return <Invoice orderNumber={orderNumber} />;
}
