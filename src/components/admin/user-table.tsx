"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

const ROLE_OPTIONS = ["user", "contributor", "moderator", "admin", "super_admin"];
const ROLE_LABEL: Record<string, string> = {
  user: "Jemaat",
  contributor: "Kontributor",
  moderator: "Moderator",
  admin: "Admin",
  super_admin: "Super Admin",
};

export function UserTable({ users, currentUserId, canEditRoles }: { users: UserRow[]; currentUserId: string; canEditRoles: boolean }) {
  const [rows, setRows] = useState(users);

  async function updateUser(id: string, patch: Partial<Pick<UserRow, "role" | "status">>) {
    const res = await fetch(`/api/admin/pengguna/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Gagal memperbarui pengguna");
      return;
    }
    setRows((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    toast.success("Pengguna diperbarui");
  }

  return (
    <div className="space-y-2">
      {rows.map((u) => {
        const isSelf = u.id === currentUserId;
        return (
          <Card key={u.id} className="flex flex-wrap items-center gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{u.name} {isSelf && <span className="text-xs text-muted-foreground">(kamu)</span>}</p>
              <p className="truncate text-sm text-muted-foreground">{u.email}</p>
            </div>

            <select
              value={u.role}
              disabled={isSelf || !canEditRoles}
              onChange={(e) => updateUser(u.id, { role: e.target.value })}
              className="h-9 rounded-md border border-border bg-surface px-2.5 text-xs font-medium outline-none disabled:opacity-50"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{ROLE_LABEL[r]}</option>
              ))}
            </select>

            <button
              disabled={isSelf}
              onClick={() => updateUser(u.id, { status: u.status === "active" ? "suspended" : "active" })}
              className={cn(
                "h-9 rounded-full px-3 text-xs font-semibold disabled:opacity-50",
                u.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600",
              )}
            >
              {u.status === "active" ? "Aktif" : u.status === "suspended" ? "Ditangguhkan" : "Diblokir"}
            </button>
          </Card>
        );
      })}
    </div>
  );
}
