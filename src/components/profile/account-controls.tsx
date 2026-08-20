"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  LivynAlert,
  LivynDownload,
  LivynSpinner,
  LivynTrash,
} from "@/components/icons/livyn-icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Bundles the two Play/App-Store-mandatory account controls: data export and
 * account deletion. Both live under the same "Data & Akun" section on the
 * profile page so the reviewer path to each is one tap.
 */

export function AccountControls({ hasPassword }: { hasPassword: boolean }) {
  const [exporting, setExporting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/auth/data-saya");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error ?? "Gagal mengekspor data");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("content-disposition") ?? "";
      const m = cd.match(/filename="([^"]+)"/);
      a.download = m?.[1] ?? "livyn-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Berkas data sudah diunduh");
    } catch {
      toast.error("Gagal mengekspor data");
    } finally {
      setExporting(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      const body = hasPassword ? { password: confirm } : { confirmPhrase: confirm };
      const res = await fetch("/api/auth/akun/hapus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Gagal menghapus akun");
        setDeleting(false);
        return;
      }
      toast.success("Akunmu telah dihapus. Semoga Tuhan menyertai perjalananmu.");
      // Cookies are already cleared server-side; a hard reload lands on /.
      window.location.href = "/";
    } catch {
      toast.error("Gagal menghapus akun");
      setDeleting(false);
    }
  }

  return (
    <div className="mt-6">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Data & Akun
      </p>
      <Card className="divide-y divide-border-subtle overflow-hidden">
        <button
          onClick={exportData}
          disabled={exporting}
          className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-surface-muted/50 disabled:opacity-60"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted">
            {exporting ? (
              <LivynSpinner className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <LivynDownload className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1">
            <span className="text-[13px] font-medium text-heading">Unduh Data Saya</span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Semua data akunmu dalam satu berkas JSON
            </p>
          </div>
        </button>

        <button
          onClick={() => setDialogOpen(true)}
          className="flex w-full items-center gap-3.5 p-4 text-left transition-colors hover:bg-red-500/5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/10">
            <LivynTrash className="h-4 w-4 text-red-500" />
          </div>
          <div className="flex-1">
            <span className="text-[13px] font-medium text-red-600 dark:text-red-400">
              Hapus Akun
            </span>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Menghapus akun dan seluruh datamu secara permanen
            </p>
          </div>
        </button>
      </Card>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-6 pt-6 sm:items-center"
          onClick={() => !deleting && setDialogOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <LivynAlert className="h-5 w-5 text-red-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-base font-bold text-heading">
                  Hapus akun secara permanen?
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  Semua datamu — jurnal, ayat favorit, pengingat doa, keanggotaan
                  Circle — akan dihapus dan tidak bisa dipulihkan.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-[12px] font-medium text-heading">
                {hasPassword
                  ? "Masukkan kata sandimu untuk mengonfirmasi"
                  : "Ketik HAPUS untuk mengonfirmasi"}
              </label>
              <input
                type={hasPassword ? "password" : "text"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoFocus
                disabled={deleting}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                placeholder={hasPassword ? "Kata sandi" : "HAPUS"}
              />
            </div>

            <div className="mt-5 flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
                disabled={deleting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={deleteAccount}
                disabled={deleting || confirm.length === 0}
              >
                {deleting && <LivynSpinner className="h-4 w-4 animate-spin" />}
                Hapus Akun
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
