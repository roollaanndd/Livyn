import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { ScrollWorld } from "@/components/scroll-world/scroll-world";
import { Marketing } from "@/components/landing/marketing";
import { livynWorld } from "@/lib/scroll-world/livyn-world";

export const metadata: Metadata = {
  title: "Livyn — Faith. Every Day. Every Step.",
  description:
    "Gulir untuk menyusuri dunia Livyn: renungan harian, Alkitab, pengingat doa, AI Pastor, khotbah, dan circle untuk bertumbuh bersama.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Livyn — Faith. Every Day. Every Step.",
    description:
      "Renungan harian, Alkitab, pengingat doa, AI Pastor, dan khotbah dalam satu tempat yang tenang.",
    type: "website",
    locale: "id_ID",
  },
};

/**
 * The public landing page. It never redirects: a signed-in visitor can still
 * read the site, the entrance simply becomes "Buka Livyn" for them. The app
 * itself lives behind `/mulai` (which is the old splash — first visit goes to
 * onboarding, otherwise to the login form), `/masuk` and `/app`; none of it is
 * touched from here.
 */
export default async function RootPage() {
  const session = await getCurrentUser().catch(() => null);
  const signedIn = session != null;
  const config = livynWorld({ signedIn, role: session?.role });

  return (
    <main className="sw-page">
      {/* The hook: a scroll-driven camera flight through the seven scenes. */}
      <ScrollWorld config={config} retireAt=".lv-page" />

      {/* The substance, in normal flow. This is also what crawlers and link
          previews read — the cinematic's copy is injected by script, so it
          cannot carry the page on its own. */}
      <h1 className="sr-only">Livyn — Faith. Every Day. Every Step.</h1>
      <Marketing signedIn={signedIn} />
    </main>
  );
}
