"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, PenLine, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { FavoriteVerseRow } from "@/lib/queries/favorites";

export function FavoriteList({ favorites, locale }: { favorites: FavoriteVerseRow[]; locale: Locale }) {
  const t = useT();
  const [rows, setRows] = useState(favorites);
  const [editing, setEditing] = useState<string | null>(null);

  async function remove(id: string) {
    const snapshot = rows;
    setRows((current) => current.filter((row) => row.id !== id));
    const res = await fetch(`/api/favorit/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setRows(snapshot);
      toast.error(t("common.errorGeneric"));
      return;
    }
    toast.success(t("favorites.removedToast"));
  }

  async function saveNote(id: string, note: string) {
    const trimmed = note.trim();
    const snapshot = rows;
    setRows((current) => current.map((row) => (row.id === id ? { ...row, note: trimmed || null } : row)));
    setEditing(null);
    const res = await fetch(`/api/favorit/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: trimmed || null }),
    }).catch(() => null);
    if (!res?.ok) {
      setRows(snapshot);
      toast.error(t("common.errorGeneric"));
    }
  }

  return (
    <ul className="mt-2 space-y-3">
      {rows.map((row) => (
        <li key={row.id}>
          <Card className="p-4">
            <p className="font-display text-[15px] leading-[1.65] text-heading">&ldquo;{row.text}&rdquo;</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Link
                href={`/app/alkitab/${row.bookCode}/${row.chapter}`}
                className="text-[12.5px] font-bold text-primary"
              >
                {row.bookName} {row.chapter}:{row.verse}
              </Link>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditing(editing === row.id ? null : row.id)}
                  aria-label={t("favorites.noteLabel")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 active:scale-95"
                >
                  <PenLine className="h-4 w-4" />
                </button>
                <button
                  onClick={() => remove(row.id)}
                  aria-label={t("common.delete")}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {editing === row.id ? (
              <NoteEditor
                initial={row.note ?? ""}
                placeholder={t("favorites.notePlaceholder")}
                onSave={(note) => saveNote(row.id, note)}
              />
            ) : (
              row.note && (
                <p className="mt-2.5 rounded-xl bg-surface-muted px-3.5 py-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  {row.note}
                </p>
              )
            )}

            <p className="mt-2.5 text-[11px] text-muted-foreground/70">
              {new Date(row.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  );
}

function NoteEditor({
  initial,
  placeholder,
  onSave,
}: {
  initial: string;
  placeholder: string;
  onSave: (note: string) => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  return (
    <div className="mt-2.5 flex items-end gap-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={1000}
        autoFocus
        className="flex-1 resize-none rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-[12.5px] leading-relaxed text-heading outline-none focus:border-primary/40"
      />
      <button
        onClick={async () => {
          setSaving(true);
          await onSave(value);
          setSaving(false);
        }}
        disabled={saving}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white active:scale-95 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
      </button>
    </div>
  );
}
