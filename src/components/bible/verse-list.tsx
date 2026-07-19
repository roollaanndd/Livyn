"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Highlighter, StickyNote, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type Verse = { id: string; verse: number; text: string };
type NoteRow = { id: string; verse: number; text: string };

export function VerseList({
  bookCode,
  chapter,
  bookName,
  verses,
  initialHighlightedVerses,
  initialNotes,
}: {
  bookCode: string;
  chapter: number;
  bookName: string;
  verses: Verse[];
  initialHighlightedVerses: number[];
  initialNotes: NoteRow[];
}) {
  const [highlighted, setHighlighted] = useState(new Set(initialHighlightedVerses));
  const [notes, setNotes] = useState(new Map(initialNotes.map((n) => [n.verse, n.text])));
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [editingNote, setEditingNote] = useState<number | null>(null);

  async function toggleHighlight(verse: number) {
    setHighlighted((prev) => {
      const next = new Set(prev);
      if (next.has(verse)) next.delete(verse);
      else next.add(verse);
      return next;
    });
    await fetch("/api/alkitab/highlight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookCode, chapter, verse, color: "gold" }),
    }).catch(() => toast.error("Gagal menyimpan sorotan"));
  }

  async function saveNote(verse: number) {
    if (!noteDraft.trim()) return;
    const res = await fetch("/api/alkitab/note", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookCode, chapter, verse, text: noteDraft.trim() }),
    });
    if (res.ok) {
      setNotes((prev) => new Map(prev).set(verse, noteDraft.trim()));
      toast.success("Catatan disimpan");
      setEditingNote(null);
      setNoteDraft("");
    } else {
      toast.error("Gagal menyimpan catatan");
    }
  }

  async function copyVerse(verse: number, text: string) {
    await navigator.clipboard.writeText(`"${text}" — ${bookName} ${chapter}:${verse}`);
    toast.success("Ayat disalin");
  }

  return (
    <div className="space-y-1">
      {verses.map((v) => {
        const isActive = activeVerse === v.verse;
        const isHighlighted = highlighted.has(v.verse);
        const note = notes.get(v.verse);
        return (
          <div key={v.id} id={`v${v.verse}`} className="scroll-mt-20">
            <button
              onClick={() => setActiveVerse(isActive ? null : v.verse)}
              className={cn(
                "devotion-body block w-full rounded-md px-2 py-1.5 text-left transition-colors",
                isHighlighted && "bg-amber-200/40 dark:bg-amber-400/15",
              )}
            >
              <sup className="mr-1 font-display text-[0.7em] font-bold text-primary">{v.verse}</sup>
              {v.text}
            </button>

            {note && !isActive && (
              <p className="ml-2 flex items-center gap-1 pb-1 text-xs text-muted-foreground">
                <StickyNote className="h-3 w-3" /> {note}
              </p>
            )}

            {isActive && (
              <div className="mb-2 ml-2 space-y-2 rounded-md border border-border bg-surface-muted p-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleHighlight(v.verse)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium",
                      isHighlighted ? "bg-amber-400 text-amber-950" : "bg-surface text-muted-foreground",
                    )}
                  >
                    <Highlighter className="h-3.5 w-3.5" /> Sorot
                  </button>
                  <button
                    onClick={() => {
                      setEditingNote(v.verse);
                      setNoteDraft(note ?? "");
                    }}
                    className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <StickyNote className="h-3.5 w-3.5" /> Catatan
                  </button>
                  <button
                    onClick={() => copyVerse(v.verse, v.text)}
                    className="flex items-center gap-1 rounded-full bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <Copy className="h-3.5 w-3.5" /> Salin
                  </button>
                </div>

                {editingNote === v.verse && (
                  <div className="space-y-2">
                    <textarea
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      placeholder="Tulis catatanmu untuk ayat ini..."
                      rows={3}
                      className="w-full rounded-md border border-border bg-surface p-2 text-sm outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => saveNote(v.verse)}
                      className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                    >
                      Simpan Catatan
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
