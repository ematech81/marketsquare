import { Suspense } from "react";
import OrderView from "@/components/OrderView";

type Params = Promise<{ orderNumber: string }>;

export const metadata = { title: "Your order | Square Market" };

export default function OrderPage({ params }: { params: Params }) {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-6 pt-6 pb-14">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Order params={params} />
      </Suspense>
    </main>
  );
}

async function Order({ params }: { params: Params }) {
  const { orderNumber } = await params;
  return <OrderView orderNumber={orderNumber} />;
}
