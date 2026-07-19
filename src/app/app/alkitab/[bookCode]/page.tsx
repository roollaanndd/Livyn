import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/session";
import { getBibleBookByCode, getChaptersWithText } from "@/lib/queries/bible";
import { TopBar } from "@/components/nav/top-bar";
import { cn } from "@/lib/utils";

export default async function BookChaptersPage({ params }: { params: Promise<{ bookCode: string }> }) {
  const session = await getCurrentUser();
  if (!session) redirect("/masuk");

  const { bookCode } = await params;
  const book = await getBibleBookByCode(bookCode);
  if (!book) notFound();

  const chaptersWithText = await getChaptersWithText(book.id);
  const chapters = Array.from({ length: book.chapterCount }, (_, i) => i + 1);

  return (
    <div>
      <TopBar back title={book.name} />
      <div className="px-4 pb-6 pt-3">
        <p className="mb-3 text-xs text-muted-foreground">
          {chaptersWithText.size < book.chapterCount &&
            "Pasal bertanda titik memiliki teks lengkap tersedia; pasal lainnya masih dalam proses penambahan."}
        </p>
        <div className="grid grid-cols-5 gap-2">
          {chapters.map((c) => (
            <Link key={c} href={`/app/alkitab/${book.code}/${c}`}>
              <div
                className={cn(
                  "relative flex h-12 items-center justify-center rounded-md border text-sm font-semibold active:scale-[0.95] transition-transform",
                  chaptersWithText.has(c)
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border bg-surface text-foreground",
                )}
              >
                {c}
                {chaptersWithText.has(c) && (
                  <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
