import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getBibleBookByCode,
  getChapterVerses,
  getUserHighlightsForChapter,
  getUserNotesForChapter,
} from "@/lib/queries/bible";
import { TopBar } from "@/components/nav/top-bar";
import { FontSizeControl } from "@/components/devotion/font-size-control";
import { VerseList } from "@/components/bible/verse-list";

export default async function ChapterReaderPage({
  params,
}: {
  params: Promise<{ bookCode: string; chapter: string }>;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const { bookCode, chapter: chapterStr } = await params;
  const chapter = Number(chapterStr);
  const book = await getBibleBookByCode(bookCode);
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapterCount) notFound();

  const [verses, highlights, notes] = await Promise.all([
    getChapterVerses(book.id, chapter),
    getUserHighlightsForChapter(session.sub, bookCode, chapter),
    getUserNotesForChapter(session.sub, bookCode, chapter),
  ]);

  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < book.chapterCount ? chapter + 1 : null;

  return (
    <div>
      <TopBar back title={`${book.name} ${chapter}`} actions={<FontSizeControl />} />

      <div className="px-4 pb-24 pt-3">
        {verses.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Teks untuk {book.name} pasal {chapter} belum tersedia di build ini. Struktur navigasi kitab sudah
            lengkap 66 kitab — ayat akan bertambah seiring integrasi sumber teks berlisensi.
          </div>
        ) : (
          <VerseList
            bookCode={bookCode}
            chapter={chapter}
            bookName={book.name}
            verses={verses}
            initialHighlightedVerses={highlights.map((h) => h.verse)}
            initialNotes={notes.map((n) => ({ id: n.id, verse: n.verse, text: n.text }))}
          />
        )}

        <div className="mt-8 flex items-center justify-between">
          {prevChapter ? (
            <Link href={`/app/alkitab/${bookCode}/${prevChapter}`} className="flex items-center gap-1 text-sm font-semibold text-primary">
              <ChevronLeft className="h-4 w-4" /> Pasal {prevChapter}
            </Link>
          ) : (
            <span />
          )}
          {nextChapter && (
            <Link href={`/app/alkitab/${bookCode}/${nextChapter}`} className="flex items-center gap-1 text-sm font-semibold text-primary">
              Pasal {nextChapter} <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
