import { Contact, H2, PolicyPage } from "@/components/PolicyPage";

export const metadata = { title: "Privacy | Square Market" };

export default function Page() {
  return (
    <PolicyPage title="Privacy">
      <p>This page explains what we collect when you use Square Market, and why.</p>
      <H2>What we collect</H2>
      <p>
        Your name, email, phone number and password (stored in scrambled form, never as plain text), your delivery
        address, and your orders. If you apply to sell, we also collect your business details, ID details and bank
        account for payouts.
      </p>
      <H2>Why we use it</H2>
      <p>
        To process and deliver your orders, to send you order emails and SMS, to let you sign in, and to keep the store
        safe from fraud.
      </p>
      <H2>Who helps us run the store</H2>
      <p>These companies handle some of your information for us, only to do their job:</p>
      <ul className="list-disc pl-6">
        <li>KoraPay takes your payment. We do not see or store card details.</li>
        <li>Brevo sends our emails.</li>
        <li>BulkSMS Nigeria sends our SMS messages.</li>
        <li>Cloudinary stores product pictures.</li>
        <li>MongoDB Atlas stores our data.</li>
      </ul>
      <p>We do not sell your information.</p>
      <H2>Your choices</H2>
      <p>You can ask us to correct or delete your account details. Some order records must be kept for our accounts.</p>
      <Contact />
    </PolicyPage>
  );
}
