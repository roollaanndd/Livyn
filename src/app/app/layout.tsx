import { BottomNav } from "@/components/nav/bottom-nav";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale } from "@/lib/i18n/server";
import { requireAcceptedTerms } from "@/lib/terms/guard";
import { HabitBeacon } from "@/components/push/habit-beacon";
import { PushSoftPrompt } from "@/components/push/push-soft-prompt";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Server-side gate: every /app route is unreachable until the user has
  // accepted the current terms. Enforced here rather than in proxy.ts because
  // the check needs the database, which the proxy runtime cannot reach.
  await requireAcceptedTerms();
  const locale = await getLocale();

  return (
    <I18nProvider locale={locale}>
      <div className="mx-auto min-h-dvh max-w-md bg-background pb-28">
        {children}
        <BottomNav />
        {/* Service worker registration lives in the root layout so it also covers
            the splash, onboarding and auth routes. */}
        <InstallPrompt />
        <HabitBeacon />
        <PushSoftPrompt />
      </div>
    </I18nProvider>
  );
}
