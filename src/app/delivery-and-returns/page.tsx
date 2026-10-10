import { Contact, H2, PolicyPage } from "@/components/PolicyPage";
import { getSettings } from "@/lib/settings";
import { formatNaira } from "@/lib/format";

export const metadata = { title: "Delivery and returns | Square Market" };

export default function Page() {
  return (
    <PolicyPage title="Delivery and returns">
      <Content />
    </PolicyPage>
  );
}

async function Content() {
  const { minOrderAmount, returnDays } = await getSettings();
  return (
    <>
      <H2>Delivery</H2>
      <p>We deliver your order to you ourselves. Delivery is available to the states listed at checkout.</p>
      <p>
        The delivery fee depends on your state and is shown at checkout before you pay. Each delivery also shows how many
        days it usually takes.
      </p>
      <H2>Minimum order</H2>
      <p>
        The items in your order must add up to at least <strong>{formatNaira(minOrderAmount)}</strong>. Delivery fees do
        not count towards this amount. If your cart is below it, checkout tells you how much more to add.
      </p>
      <H2>Tracking your order</H2>
      <p>
        After you pay, you can follow each step of your order (placed, confirmed, packed, shipped, delivered) under My
        orders. We also email you, and send an SMS, when your order is received, on its way and delivered.
      </p>
      <H2>Returns</H2>
      <p>
        You can return an item within <strong>{returnDays} days</strong> of delivery. To start a return, contact us with
        your order number and tell us which item you want to return and why. We will tell you how to send it back.
      </p>
      <p>
        Please keep the item in the condition you received it, with its packaging, so we can accept it back.
      </p>
      <H2>Refunds</H2>
      <p>
        When a return is accepted, or if we have to cancel part of your order, we refund the amount you paid for the
        affected items. Refunds go back to the payment method you used.
      </p>
      <Contact />
    </>
  );
}
