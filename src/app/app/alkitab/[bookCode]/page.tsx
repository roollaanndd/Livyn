import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getBibleBookByCode } from "@/lib/queries/bible";
import { TopBar } from "@/components/nav/top-bar";

export default async function BookChaptersPage({ params }: { params: Promise<{ bookCode: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { bookCode } = await params;
  const book = await getBibleBookByCode(bookCode);
  if (!book) notFound();

  const chapters = Array.from({ length: book.chapterCount }, (_, i) => i + 1);

  return (
    <div>
      <TopBar back title={book.name} />
      <div className="px-4 pb-6 pt-3">
        <p className="mb-3 text-xs text-muted-foreground">
          Pilih pasal untuk membaca — {book.chapterCount} pasal tersedia.
        </p>
        <div className="grid grid-cols-5 gap-2">
          {chapters.map((c) => (
            <Link key={c} href={`/app/alkitab/${book.code}/${c}`}>
              <div className="flex h-12 items-center justify-center rounded-md border border-border bg-surface text-sm font-semibold text-foreground active:scale-[0.95] transition-transform hover:bg-surface-muted hover:border-primary/20">
                {c}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
