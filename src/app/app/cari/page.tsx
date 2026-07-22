import Link from "next/link";
import { redirect } from "next/navigation";
import { Search, BookOpenText, Sparkles, Clapperboard, Tag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { unifiedSearch } from "@/lib/queries/search";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { q } = await searchParams;
  const results = q ? await unifiedSearch(q) : null;
  const totalResults = results ? results.devotions.length + results.verses.length + results.sermons.length + results.categories.length : 0;

  return (
    <div>
      <TopBar title="Cari" back />
      <div className="px-5 pt-4">
        <form action="/app/cari" className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/50" />
          <input
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Cari renungan, ayat, khotbah, topik..."
            className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 focus:shadow-[var(--shadow-glow)] placeholder:text-muted-foreground/50"
          />
        </form>
      </div>

      <div className="space-y-6 px-5 pb-8 pt-5">
        {!q && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <p className="text-[13px] text-muted-foreground max-w-[240px] leading-relaxed">
              Cari lintas renungan, ayat Alkitab, khotbah, dan topik dalam satu tempat.
            </p>
          </div>
        )}

        {q && totalResults === 0 && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-[13px] text-muted-foreground">Tidak ada hasil untuk &ldquo;{q}&rdquo;.</p>
          </div>
        )}

        {results && results.categories.length > 0 && (
          <ResultSection title="Topik" icon={Tag}>
            <div className="flex flex-wrap gap-2">
              {results.categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/app/devosi?kategori=${c.slug}`}
                  className="rounded-full bg-primary-soft px-4 py-2 text-[13px] font-medium text-primary hover:bg-primary/15 transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </ResultSection>
        )}

        {results && results.devotions.length > 0 && (
          <ResultSection title="Renungan" icon={Sparkles}>
            <div className="stagger space-y-2.5">
              {results.devotions.map((d) => (
                <Link key={d.id} href={`/app/devosi/${d.slug}`}>
                  <Card className="animate-slide-up-fade p-4 active:scale-[0.98] transition-transform">
                    <p className="font-semibold text-heading text-[14px]">{d.title}</p>
                    <p className="line-clamp-1 text-[13px] text-muted-foreground mt-0.5">{d.excerpt}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </ResultSection>
        )}

        {results && results.verses.length > 0 && (
          <ResultSection title="Ayat Alkitab" icon={BookOpenText}>
            <div className="stagger space-y-2.5">
              {results.verses.map((v) => (
                <Link key={v.id} href={`/app/alkitab/${v.book.code}/${v.chapter}#v${v.verse}`}>
                  <Card className="animate-slide-up-fade p-4 active:scale-[0.98] transition-transform">
                    <p className="text-[13px] font-semibold text-primary">{v.book.name} {v.chapter}:{v.verse}</p>
                    <p className="line-clamp-2 text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{v.text}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </ResultSection>
        )}

        {results && results.sermons.length > 0 && (
          <ResultSection title="Khotbah" icon={Clapperboard}>
            <div className="stagger space-y-2.5">
              {results.sermons.map((s) => (
                <Link key={s.id} href={`/app/khotbah/${s.slug}`}>
                  <Card className="animate-slide-up-fade p-4 active:scale-[0.98] transition-transform">
                    <p className="font-semibold text-heading text-[14px]">{s.title}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{s.pastor} · {s.church}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </ResultSection>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, icon: Icon, children }: { title: string; icon: typeof Search; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {children}
    </div>
  );
}
