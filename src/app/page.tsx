import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { ScrollWorld } from "@/components/scroll-world/scroll-world";
import { livynWorld, WORLD_SECTIONS } from "@/lib/scroll-world/livyn-world";

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
  const config = livynWorld({ signedIn: session != null, role: session?.role });
  const entrance = config.sections[config.sections.length - 1].cta;

  return (
    <main className="sw-page">
      <ScrollWorld config={config} />

      {/* Without JavaScript the engine never mounts, so the same copy is served
          as an ordinary document. `.sw-static` is display:none until this
          <noscript> turns it back on. */}
      <noscript>
        <style>{".sw-static{display:block;padding:2rem 1.25rem;max-width:44rem;margin:0 auto}"}</style>
      </noscript>
      <div className="sw-static">
        <h1>Livyn — Faith. Every Day. Every Step.</h1>
        {WORLD_SECTIONS.map((s) => (
          <section key={s.id}>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
        <p>
          {entrance?.primary ? <a href={entrance.primary.href}>{entrance.primary.label}</a> : null}
          {entrance?.secondary ? (
            <>
              {" · "}
              <a href={entrance.secondary.href}>{entrance.secondary.label}</a>
            </>
          ) : null}
        </p>
      </div>
    </main>
  );
}
