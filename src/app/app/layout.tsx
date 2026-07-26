import { BottomNav } from "@/components/nav/bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-28">
      {children}
      <BottomNav />
      {/* Service worker registration lives in the root layout so it also covers
          the splash, onboarding and auth routes. */}
      <InstallPrompt />
    </div>
  );
}
