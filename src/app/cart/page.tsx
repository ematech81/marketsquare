import { redirect } from "next/navigation";

// The design puts the cart and checkout on one screen.
export default function CartPage() {
  redirect("/checkout");
}
