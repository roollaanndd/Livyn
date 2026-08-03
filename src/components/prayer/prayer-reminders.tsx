"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Flame, Plus, Sunrise, Sun, Moon, MoonStar, Sparkles, Trash2, Pencil, Check, BellRing,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  pushSupported,
  subscribeToPush,
  currentSubscription,
} from "@/lib/push/client";

type Reminder = {
  id: string;
  label: string;
  slot: string;
  time: string;
  daysOfWeek: string;
  ringtone: string;
  repeat: boolean;
  verseAfter: boolean;
  active: boolean;
};

const SLOT_META: Record<string, { label: string; icon: typeof Sun }> = {
  morning: { label: "Pagi", icon: Sunrise },
  lunch: { label: "Siang", icon: Sun },
  evening: { label: "Malam", icon: Moon },
  midnight: { label: "Tengah Malam", icon: MoonStar },
  custom: { label: "Kustom", icon: Sparkles },
};

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const EMPTY_FORM = {
  label: "",
  slot: "morning" as keyof typeof SLOT_META,
  time: "06:00",
  days: new Set([0, 1, 2, 3, 4, 5, 6]),
  ringtone: "default",
  repeat: true,
  verseAfter: true,
};

export function PrayerReminders({
  initialReminders,
  initialDoneToday,
  streak,
}: {
  initialReminders: Reminder[];
  initialDoneToday: string[];
  streak: number;
}) {
  const [reminders, setReminders] = useState(initialReminders);
  const [doneToday, setDoneToday] = useState(new Set(initialDoneToday));
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  // Real background reminders need a push subscription on the server, not just
  // browser permission — a granted permission with no PushSubscription row is
  // the state the cron endpoint has nothing to send to, which is why the CTA
  // used to end here silently. Track the subscription itself.
  const [pushStatus, setPushStatus] =
    useState<"loading" | "unsupported" | "off" | "on">("loading");
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!pushSupported()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPushStatus("unsupported");
      return;
    }
    currentSubscription()
      .then((sub) => setPushStatus(sub ? "on" : "off"))
      .catch(() => setPushStatus("off"));
  }, []);

  // Belt-and-braces: if the tab happens to be open when a reminder is due,
  // fire a local notification too. The real delivery path is the cron push;
  // this just avoids the awkwardness of the app being open and staying silent.
  useEffect(() => {
    if (pushStatus !== "on") return;
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const timers = reminders
      .filter((r) => r.active)
      .map((r) => {
        const [h, m] = r.time.split(":").map(Number);
        const now = new Date();
        const target = new Date();
        target.setHours(h, m, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 1);
        const ms = target.getTime() - now.getTime();
        if (ms > 24 * 60 * 60 * 1000) return null;
        return setTimeout(() => {
          new Notification(`🙏 ${r.label}`, { body: "Waktunya berdoa. Tuhan menantikanmu." });
        }, ms);
      })
      .filter(Boolean) as ReturnType<typeof setTimeout>[];
    return () => timers.forEach(clearTimeout);
  }, [reminders, pushStatus]);

  async function enablePush() {
    if (subscribing) return;
    setSubscribing(true);
    const result = await subscribeToPush();
    setSubscribing(false);
    if (result === "subscribed") {
      setPushStatus("on");
      toast.success("Pengingat doa aktif — akan sampai walau aplikasi tertutup");
      return;
    }
    if (result === "denied") toast.error("Izin notifikasi ditolak");
    else if (result === "unconfigured") toast.error("Notifikasi belum dikonfigurasi di server ini");
    else if (result === "ios-install-required") {
      toast.info("Tambahkan Livyn ke layar utama iPhone dulu (Share > Tambahkan ke Layar Utama), lalu aktifkan notifikasi dari sana.");
    } else toast.error("Gagal mengaktifkan notifikasi");
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(r: Reminder) {
    setEditingId(r.id);
    setForm({
      label: r.label,
      slot: r.slot as keyof typeof SLOT_META,
      time: r.time,
      days: new Set(r.daysOfWeek.split(",").map(Number)),
      ringtone: r.ringtone,
      repeat: r.repeat,
      verseAfter: r.verseAfter,
    });
    setFormOpen(true);
  }

  async function saveReminder() {
    if (!form.label.trim()) {
      toast.error("Nama pengingat wajib diisi");
      return;
    }
    const payload = {
      label: form.label.trim(),
      slot: form.slot,
      time: form.time,
      daysOfWeek: Array.from(form.days).sort().join(",") || "0,1,2,3,4,5,6",
      ringtone: form.ringtone,
      repeat: form.repeat,
      verseAfter: form.verseAfter,
    };

    const res = await fetch(editingId ? `/api/doa/${editingId}` : "/api/doa", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      toast.error("Gagal menyimpan pengingat");
      return;
    }
    const data = await res.json();
    setReminders((prev) => {
      if (editingId) return prev.map((r) => (r.id === editingId ? data.reminder : r));
      return [...prev, data.reminder].sort((a, b) => a.time.localeCompare(b.time));
    });
    toast.success("Pengingat doa disimpan");
    setFormOpen(false);
  }

  async function toggleActive(r: Reminder) {
    const res = await fetch(`/api/doa/${r.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !r.active }),
    });
    if (res.ok) {
      setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)));
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/doa/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReminders((prev) => prev.filter((r) => r.id !== id));
      toast.success("Pengingat dihapus");
    }
  }

  async function markPrayed(reminderId: string) {
    const res = await fetch("/api/doa/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reminderId }),
    });
    if (res.ok) {
      setDoneToday((prev) => new Set(prev).add(reminderId));
      toast.success("Tercatat. Tetap semangat berdoa!");
    }
  }

  const sortedReminders = useMemo(() => [...reminders].sort((a, b) => a.time.localeCompare(b.time)), [reminders]);

  return (
    <div className="px-4 pb-24 pt-3">
      <Card className="mb-5 flex items-center justify-between border-none bg-gradient-to-br from-primary to-secondary p-5 text-white">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-white/70">Streak Doa</p>
          <p className="font-display text-2xl font-bold">{streak} Hari Berturut-turut</p>
        </div>
        <Flame className="h-9 w-9 text-amber-300" />
      </Card>

      {pushStatus === "off" && (
        <button
          onClick={enablePush}
          disabled={subscribing}
          className="mb-5 flex w-full items-center gap-3 rounded-md border border-dashed border-primary/40 bg-primary/5 p-3.5 text-left disabled:opacity-60"
        >
          <BellRing className="h-5 w-5 shrink-0 text-primary" />
          <span className="text-sm text-foreground">
            Aktifkan notifikasi supaya Livyn bisa mengingatkanmu berdoa walau aplikasi tertutup.
          </span>
        </button>
      )}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-bold">Pengingatku</h2>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      <div className="space-y-3">
        {sortedReminders.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Belum ada pengingat doa. Tambahkan yang pertama!</p>
        )}
        {sortedReminders.map((r) => {
          const meta = SLOT_META[r.slot] ?? SLOT_META.custom;
          const Icon = meta.icon;
          const done = doneToday.has(r.id);
          return (
            <Card key={r.id} className={cn("p-4", !r.active && "opacity-50")}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{r.label}</p>
                    <button
                      onClick={() => toggleActive(r)}
                      className={cn(
                        "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                        r.active ? "bg-primary" : "bg-border",
                      )}
                      aria-label="Aktif/nonaktif"
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
                          r.active ? "translate-x-4" : "translate-x-0.5",
                        )}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {meta.label} · {r.time} · {r.daysOfWeek.split(",").length === 7 ? "Setiap hari" : r.daysOfWeek.split(",").map((d) => DAY_LABELS[Number(d)]).join(", ")}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      onClick={() => markPrayed(r.id)}
                      disabled={done}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold",
                        done ? "bg-emerald-500/15 text-emerald-600" : "bg-surface-muted text-foreground",
                      )}
                    >
                      <Check className="h-3.5 w-3.5" /> {done ? "Sudah Berdoa" : "Tandai Sudah Berdoa"}
                    </button>
                    <button onClick={() => openEdit(r)} className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-muted" aria-label="Ubah">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => remove(r.id)} className="rounded-full p-1.5 text-red-500 hover:bg-red-500/10" aria-label="Hapus">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setFormOpen(false)}>
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-surface p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display mb-4 text-lg font-bold">{editingId ? "Ubah Pengingat" : "Pengingat Baru"}</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">Nama</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Contoh: Doa Pagi"
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Waktu</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <select
                    value={form.slot}
                    onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value as keyof typeof SLOT_META }))}
                    className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  >
                    {Object.entries(SLOT_META).map(([key, m]) => (
                      <option key={key} value={key}>{m.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Ulangi pada hari</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_LABELS.map((label, idx) => {
                    const active = form.days.has(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setForm((f) => {
                            const next = new Set(f.days);
                            if (next.has(idx)) next.delete(idx);
                            else next.add(idx);
                            return { ...f, days: next };
                          })
                        }
                        className={cn(
                          "h-9 w-9 rounded-full text-xs font-semibold",
                          active ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground",
                        )}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">Nada Dering</label>
                <select
                  value={form.ringtone}
                  onChange={(e) => setForm((f) => ({ ...f, ringtone: e.target.value }))}
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="default">Default</option>
                  <option value="chime">Chime Lembut</option>
                  <option value="bell">Lonceng Gereja</option>
                  <option value="piano">Piano</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tampilkan ayat penguat setelah alarm</span>
                <button
                  onClick={() => setForm((f) => ({ ...f, verseAfter: !f.verseAfter }))}
                  className={cn("relative h-5 w-9 rounded-full transition-colors", form.verseAfter ? "bg-primary" : "bg-border")}
                >
                  <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform", form.verseAfter ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>

              <Button onClick={saveReminder} size="lg" className="w-full">
                Simpan Pengingat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
