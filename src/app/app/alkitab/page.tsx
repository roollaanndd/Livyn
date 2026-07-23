import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listBibleBooks, searchBibleVerses } from "@/lib/queries/bible";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { VersionSelector } from "@/components/bible/version-selector";

export default async function BibleBooksPage({ searchParams }: { searchParams: Promise<{ cari?: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const cookieStore = await cookies();
  const currentVersion = cookieStore.get("bible-version")?.value || "TB";

  const { cari } = await searchParams;
  const [books, results] = await Promise.all([listBibleBooks(), cari ? searchBibleVerses(cari) : Promise.resolve([])]);

  const oldTestament = books.filter((b: { testament: string }) => b.testament === "old");
  const newTestament = books.filter((b: { testament: string }) => b.testament === "new");

  return (
    <div>
      <TopBar title="Alkitab" actions={<VersionSelector current={currentVersion} />} />

      <div className="px-5 pt-4">
        <form action="/app/alkitab" className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/50" />
          <input
            name="cari"
            defaultValue={cari}
            placeholder="Cari ayat, contoh: kasih, Yohanes 3:16"
            className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15 focus:shadow-[var(--shadow-glow)] placeholder:text-muted-foreground/50"
          />
        </form>
      </div>

      {cari && (
        <div className="px-5 pt-5">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            Hasil pencarian &ldquo;{cari}&rdquo; ({results.length})
          </p>
          <div className="space-y-2.5 stagger">
            {results.length === 0 && (
              <p className="py-10 text-center text-[13px] text-muted-foreground">
                Tidak ditemukan ayat yang cocok.
              </p>
            )}
            {results.map((v: { id: string; book: { code: string; name: string }; chapter: number; verse: number; text: string }) => (
              <Link key={v.id} href={`/app/alkitab/${v.book.code}/${v.chapter}#v${v.verse}`}>
                <Card className="animate-slide-up-fade p-4 active:scale-[0.98] transition-transform">
                  <p className="text-[13px] font-semibold text-primary">
                    {v.book.name} {v.chapter}:{v.verse}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">{v.text}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!cari && (
        <div className="px-5 pb-6 pt-3">
          <BookGroup title="Perjanjian Lama" books={oldTestament} />
          <BookGroup title="Perjanjian Baru" books={newTestament} />
        </div>
      )}
    </div>
  );
}

function BookGroup({ title, books }: { title: string; books: Array<{ id: string; code: string; name: string }> }) {
  return (
    <div className="mt-6">
      <h2 className="font-display mb-3 text-[12px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{title}</h2>
      <div className="grid grid-cols-3 gap-2">
        {books.map((b) => (
          <Link key={b.id} href={`/app/alkitab/${b.code}`}>
            <div className="flex h-14 items-center justify-center rounded-xl border border-border-subtle bg-surface px-2 text-center text-[13px] font-medium text-heading active:scale-[0.97] transition-all hover:bg-surface-muted hover:border-primary/20">
              {b.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
