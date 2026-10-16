import NotificationsView from "@/components/NotificationsView";

export const metadata = { title: "Notifications | Square Market", robots: { index: false, follow: false } };

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pt-8 pb-14 md:px-6">
      <NotificationsView />
    </main>
  );
}
