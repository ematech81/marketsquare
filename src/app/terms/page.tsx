import { Contact, H2, PolicyPage } from "@/components/PolicyPage";

export const metadata = { title: "Terms | Square Market" };

export default function Page() {
  return (
    <PolicyPage title="Terms of use">
      <p>By using Square Market and placing an order, you agree to these terms.</p>
      <H2>Your account</H2>
      <p>
        Give us correct details when you sign up and keep your password private. You are responsible for what happens
        under your account. We may suspend accounts that are used to cheat or harm others.
      </p>
      <H2>Orders and prices</H2>
      <p>
        Prices are in Naira. The total you see at checkout, including delivery, is what you pay. An order is confirmed
        once your payment is received. We may cancel an order if an item runs out of stock or a price was shown wrongly,
        and we will refund you in full.
      </p>
      <H2>Payment</H2>
      <p>
        Payments are handled by KoraPay on their secure page. We never see or store your card details.
      </p>
      <H2>Delivery and returns</H2>
      <p>
        Delivery and returns follow our <a href="/delivery-and-returns" className="font-semibold text-accent-ink underline">delivery and returns</a> page.
      </p>
      <H2>Reviews</H2>
      <p>
        Only customers who received a product can review it. Reviews must be honest and respectful. We can remove reviews
        that are abusive or fake.
      </p>
      <H2>Changes</H2>
      <p>We may update these terms. The version on this page is the one that applies when you place your order.</p>
      <Contact />
    </PolicyPage>
  );
}
