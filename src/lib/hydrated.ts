import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// False while the server sends the page and while the browser first attaches to it, then true.
// Anything that depends on the browser's own state (who is signed in, what is in the cart) waits for this,
// so the first thing the browser draws matches what the server sent and React has nothing to complain about.
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
