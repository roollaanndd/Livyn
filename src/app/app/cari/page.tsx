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
      <TopBar title="Cari" />
      <div className="px-4 pt-3">
        <form action="/app/cari" className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="Cari renungan, ayat, khotbah, topik..."
            className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      <div className="space-y-6 px-4 pb-6 pt-4">
        {!q && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Cari lintas renungan, ayat Alkitab, khotbah, dan topik dalam satu tempat.
          </p>
        )}

        {q && totalResults === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada hasil untuk &ldquo;{q}&rdquo;.</p>
        )}

        {results && results.categories.length > 0 && (
          <ResultSection title="Topik" icon={Tag}>
            <div className="flex flex-wrap gap-2">
              {results.categories.map((c) => (
                <Link key={c.id} href={`/app/devosi?kategori=${c.slug}`} className="rounded-full bg-surface-muted px-3.5 py-1.5 text-sm font-medium">
                  {c.name}
                </Link>
              ))}
            </div>
          </ResultSection>
        )}

        {results && results.devotions.length > 0 && (
          <ResultSection title="Renungan" icon={Sparkles}>
            <div className="space-y-2">
              {results.devotions.map((d) => (
                <Link key={d.id} href={`/app/devosi/${d.slug}`}>
                  <Card className="p-3.5">
                    <p className="font-semibold">{d.title}</p>
                    <p className="line-clamp-1 text-sm text-muted-foreground">{d.excerpt}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </ResultSection>
        )}

        {results && results.verses.length > 0 && (
          <ResultSection title="Ayat Alkitab" icon={BookOpenText}>
            <div className="space-y-2">
              {results.verses.map((v) => (
                <Link key={v.id} href={`/app/alkitab/${v.book.code}/${v.chapter}#v${v.verse}`}>
                  <Card className="p-3.5">
                    <p className="text-sm font-semibold text-primary">{v.book.name} {v.chapter}:{v.verse}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{v.text}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </ResultSection>
        )}

        {results && results.sermons.length > 0 && (
          <ResultSection title="Khotbah" icon={Clapperboard}>
            <div className="space-y-2">
              {results.sermons.map((s) => (
                <Link key={s.id} href={`/app/khotbah/${s.slug}`}>
                  <Card className="p-3.5">
                    <p className="font-semibold">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.pastor} · {s.church}</p>
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
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
        <Icon className="h-4 w-4" /> {title}
      </h2>
      {children}
    </div>
  );
}
