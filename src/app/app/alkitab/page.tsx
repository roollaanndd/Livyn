import Link from "next/link";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listBibleBooks, searchBibleVerses } from "@/lib/queries/bible";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";

export default async function BibleBooksPage({ searchParams }: { searchParams: Promise<{ cari?: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/masuk");

  const { cari } = await searchParams;
  const [books, results] = await Promise.all([listBibleBooks(), cari ? searchBibleVerses(cari) : Promise.resolve([])]);

  const oldTestament = books.filter((b) => b.testament === "old");
  const newTestament = books.filter((b) => b.testament === "new");

  return (
    <div>
      <TopBar title="Alkitab" />

      <div className="px-4 pt-3">
        <form action="/app/alkitab" className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="cari"
            defaultValue={cari}
            placeholder="Cari ayat, contoh: kasih, Yohanes 3:16"
            className="h-11 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </form>
      </div>

      {cari && (
        <div className="px-4 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hasil pencarian &ldquo;{cari}&rdquo; ({results.length})
          </p>
          <div className="space-y-2">
            {results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Tidak ditemukan. Teks Alkitab yang tersedia masih terbatas pada kutipan pilihan untuk renungan.
              </p>
            )}
            {results.map((v) => (
              <Link key={v.id} href={`/app/alkitab/${v.book.code}/${v.chapter}#v${v.verse}`}>
                <Card className="p-3.5">
                  <p className="text-sm font-semibold text-primary">
                    {v.book.name} {v.chapter}:{v.verse}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{v.text}</p>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!cari && (
        <div className="px-4 pb-6 pt-2">
          <BookGroup title="Perjanjian Lama" books={oldTestament} />
          <BookGroup title="Perjanjian Baru" books={newTestament} />
        </div>
      )}
    </div>
  );
}

function BookGroup({ title, books }: { title: string; books: Awaited<ReturnType<typeof listBibleBooks>> }) {
  return (
    <div className="mt-5">
      <h2 className="font-display mb-2 text-sm font-bold text-muted-foreground">{title}</h2>
      <div className="grid grid-cols-3 gap-2">
        {books.map((b) => (
          <Link key={b.id} href={`/app/alkitab/${b.code}`}>
            <div className="flex h-16 items-center justify-center rounded-md border border-border bg-surface px-2 text-center text-sm font-medium active:scale-[0.97] transition-transform">
              {b.name}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
