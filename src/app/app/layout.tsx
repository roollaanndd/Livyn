import { BottomNav } from "@/components/nav/bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ServiceWorkerRegister } from "@/components/pwa/sw-register";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-background pb-28">
      {children}
      <BottomNav />
      <InstallPrompt />
      <ServiceWorkerRegister />
    </div>
  );
}
