"use client";

import { useState } from "react";
import {
  LivynPlus,
  LivynCheck,
  LivynTrash,
  LivynSpinner,
  LivynPrayer,
  LivynSpark,
} from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { Locale } from "@/lib/i18n/config";
import type { PersonalPrayerRow } from "@/lib/queries/personal-prayer";

type Row = Omit<PersonalPrayerRow, "createdAt" | "answeredAt"> & {
  createdAt: string;
  answeredAt: string | null;
};

export function PersonalPrayers({ initial, locale }: { initial: Row[]; locale: Locale }) {
  const t = useT();
  const [rows, setRows] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [answering, setAnswering] = useState<string | null>(null);

  const open = rows.filter((r) => r.status !== "answered");
  const answered = rows.filter((r) => r.status === "answered");

  async function create() {
    if (title.trim().length < 2 || saving) return;
    setSaving(true);
    const res = await fetch("/api/doa/pribadi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: title.trim(), body: body.trim() || null }),
    }).catch(() => null);
    setSaving(false);

    if (!res?.ok) {
      toast.error(t("common.errorGeneric"));
      return;
    }
    const data = (await res.json()) as { prayer: Row };
    setRows((current) => [data.prayer, ...current]);
    setTitle("");
    setBody("");
    setFormOpen(false);
  }

  async function markAnswered(id: string, note: string) {
    const snapshot = rows;
    const stampedAt = new Date().toISOString();
    setRows((current) =>
      current.map((r) =>
        r.id === id ? { ...r, status: "answered", answeredNote: note.trim() || null, answeredAt: stampedAt } : r,
      ),
    );
    setAnswering(null);

    const res = await fetch(`/api/doa/pribadi/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "answered", answeredNote: note.trim() || null }),
    }).catch(() => null);

    if (!res?.ok) {
      setRows(snapshot);
      toast.error(t("common.errorGeneric"));
      return;
    }
    toast.success(t("prayers.answeredToast"));
  }

  async function remove(id: string) {
    const snapshot = rows;
    setRows((current) => current.filter((r) => r.id !== id));
    const res = await fetch(`/api/doa/pribadi/${id}`, { method: "DELETE" }).catch(() => null);
    if (!res?.ok) {
      setRows(snapshot);
      toast.error(t("common.errorGeneric"));
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="px-5 pb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[15px] font-extrabold text-heading">{t("prayers.personalTitle")}</h2>
        <Button size="sm" variant="ghost" onClick={() => setFormOpen((v) => !v)}>
          <LivynPlus className="h-4 w-4" /> {t("prayers.personalNew")}
        </Button>
      </div>

      {formOpen && (
        <Card className="mb-3 space-y-3 p-4">
          <div>
            <label className="text-[12px] font-semibold text-heading" htmlFor="prayer-title">
              {t("prayers.personalTitleLabel")}
            </label>
            <input
              id="prayer-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("prayers.personalTitlePlaceholder")}
              maxLength={120}
              className="mt-1.5 w-full rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-[13px] text-heading outline-none focus:border-primary/40"
            />
          </div>
          <div>
            <label className="text-[12px] font-semibold text-heading" htmlFor="prayer-body">
              {t("prayers.personalBodyLabel")}
            </label>
            <textarea
              id="prayer-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("prayers.personalBodyPlaceholder")}
              rows={3}
              maxLength={2000}
              className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-[13px] leading-relaxed text-heading outline-none focus:border-primary/40"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={create} disabled={saving || title.trim().length < 2}>
              {saving && <LivynSpinner className="h-3.5 w-3.5 animate-spin" />}
              {t("common.save")}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFormOpen(false)} disabled={saving}>
              {t("common.cancel")}
            </Button>
          </div>
        </Card>
      )}

      {open.length === 0 && answered.length === 0 ? (
        <Card className="p-5 text-center">
          <LivynPrayer className="mx-auto h-7 w-7 text-primary/40" />
          <p className="mt-2.5 text-[13px] text-muted-foreground">{t("prayers.emptyOpen")}</p>
        </Card>
      ) : (
        <ul className="space-y-2.5">
          {open.map((row) => (
            <li key={row.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold leading-snug text-heading">{row.title}</p>
                    {row.body && (
                      <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{row.body}</p>
                    )}
                    <p className="mt-1.5 text-[11px] text-muted-foreground/70">{formatDate(row.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => remove(row.id)}
                    aria-label={t("common.delete")}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 active:scale-95"
                  >
                    <LivynTrash className="h-4 w-4" />
                  </button>
                </div>

                {answering === row.id ? (
                  <AnsweredForm
                    label={t("prayers.answeredNoteLabel")}
                    placeholder={t("prayers.answeredNotePlaceholder")}
                    saveLabel={t("prayers.markAnswered")}
                    cancelLabel={t("common.cancel")}
                    onCancel={() => setAnswering(null)}
                    onSave={(note) => markAnswered(row.id, note)}
                  />
                ) : (
                  <button
                    onClick={() => setAnswering(row.id)}
                    className="mt-3 flex items-center gap-1.5 rounded-full bg-primary-soft px-3.5 py-2 text-[12px] font-bold text-primary active:scale-95"
                  >
                    <LivynCheck className="h-3.5 w-3.5" /> {t("prayers.markAnswered")}
                  </button>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {answered.length > 0 && (
        <div className="mt-7">
          <div className="mb-3 flex items-center gap-2">
            <LivynSpark className="h-4 w-4 text-primary" />
            <h2 className="font-display text-[15px] font-extrabold text-heading">{t("prayers.answeredTitle")}</h2>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
              {answered.length}
            </span>
          </div>
          <ul className="space-y-2.5">
            {answered.map((row) => (
              <li key={row.id}>
                <Card className={cn("border-primary/15 bg-gradient-to-r from-primary-soft to-transparent p-4")}>
                  <p className="text-[14px] font-bold leading-snug text-heading">{row.title}</p>
                  {row.answeredNote && (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">{row.answeredNote}</p>
                  )}
                  {row.answeredAt && (
                    <p className="mt-2 text-[11px] font-semibold text-primary">
                      {t("prayers.answeredOn", { date: formatDate(row.answeredAt) })}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AnsweredForm({
  label,
  placeholder,
  saveLabel,
  cancelLabel,
  onSave,
  onCancel,
}: {
  label: string;
  placeholder: string;
  saveLabel: string;
  cancelLabel: string;
  onSave: (note: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  return (
    <div className="mt-3 rounded-xl bg-surface-muted p-3">
      <label className="text-[12px] font-semibold text-heading">{label}</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder={placeholder}
        rows={2}
        maxLength={2000}
        autoFocus
        className="mt-1.5 w-full resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-[12.5px] leading-relaxed text-heading outline-none focus:border-primary/40"
      />
      <div className="mt-2.5 flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            setSaving(true);
            await onSave(note);
            setSaving(false);
          }}
          disabled={saving}
        >
          {saving && <LivynSpinner className="h-3.5 w-3.5 animate-spin" />}
          {saveLabel}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          {cancelLabel}
        </Button>
      </div>
    </div>
  );
}
