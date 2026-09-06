import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { ScrollWorld } from "@/components/scroll-world/scroll-world";
import { Marketing, LANDING_FAQ } from "@/components/landing/marketing";
import { livynWorld } from "@/lib/scroll-world/livyn-world";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

const TITLE = "Livyn — Faith. Every Day. Every Step.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "renungan harian",
    "aplikasi Alkitab",
    "pengingat doa",
    "jurnal rohani",
    "khotbah",
    "aplikasi Kristen Indonesia",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    siteName: SITE_NAME,
    title: TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    type: "website",
    locale: "id_ID",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: SITE_DESCRIPTION },
};

/**
 * Structured data for the landing page.
 *
 * Two graphs, both describing things that are actually on the page: the app
 * itself (free, browser-based, Indonesian) and the FAQ, which is rendered from
 * the same array the markup uses — so the answers can never drift apart from
 * what a reader sees, which is exactly what gets a rich result pulled.
 */
function structuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "id-ID",
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE_URL}/#app`,
        name: SITE_NAME,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "Web, Android, iOS",
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: "id-ID",
        offers: { "@type": "Offer", price: "0", priceCurrency: "IDR" },
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE_URL}/#faq`,
        mainEntity: LANDING_FAQ.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      },
    ],
  };
}

/**
 * The public landing page. It never redirects: a signed-in visitor can still
 * read the site, the entrance simply becomes "Buka Livyn" for them. The app
 * itself lives behind `/mulai` (which is the old splash — first visit goes to
 * onboarding, otherwise to the login form), `/masuk` and `/app`; none of it is
 * touched from here.
 *
 * `getCurrentUser` is deliberately allowed to fail closed: when the database
 * is unreachable the marketing site still renders in full, signed out. The
 * website going dark with the backend would be the worst possible time for it
 * to be unreadable.
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
          cannot carry the page on its own. The <h1> lives in here, at the top
          of the readable page, rather than as a screen-reader-only line. */}
      <Marketing signedIn={signedIn} />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
      />
    </main>
  );
}
