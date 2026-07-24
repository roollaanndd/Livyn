"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { loadBook } from "@/lib/bible/offline-store";
import { VerseList } from "@/components/bible/verse-list";

export function OfflineChapter({
  bookCode,
  chapter,
  bookName,
  initialHighlightedVerses,
  initialNotes,
}: {
  bookCode: string;
  chapter: number;
  bookName: string;
  initialHighlightedVerses: number[];
  initialNotes: Array<{ id: string; verse: number; text: string }>;
}) {
  const [verses, setVerses] = useState<Array<{ id: string; verse: number; text: string }> | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const book = await loadBook(bookCode);
      if (cancelled) return;
      const ch = book?.chapters?.[chapter - 1];
      if (!ch || ch.length === 0) {
        setFailed(true);
        return;
      }
      setVerses(
        ch
          .map((text, i) => ({ id: `${bookCode}-${chapter}-${i + 1}`, verse: i + 1, text }))
          .filter((v) => v.text.trim().length > 0),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [bookCode, chapter]);

  if (failed) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        <p>
          Teks {bookName} pasal {chapter} tidak dapat dimuat. Periksa koneksi internetmu, atau unduh
          Alkitab lengkap dari halaman daftar kitab.
        </p>
      </div>
    );
  }

  if (!verses) {
    return (
      <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin text-primary" /> Memuat ayat...
      </div>
    );
  }

  return (
    <VerseList
      bookCode={bookCode}
      chapter={chapter}
      bookName={bookName}
      verses={verses}
      initialHighlightedVerses={initialHighlightedVerses}
      initialNotes={initialNotes}
    />
  );
}
