"use client";

import { useState } from "react";
import { LivynUserMinus, LivynSend } from "@/components/icons/livyn-icons";
import { toast } from "sonner";

type Friend = { id: string; name: string; avatarUrl: string | null };

export function FriendList({ friends: initial }: { friends: Friend[] }) {
  const [friends, setFriends] = useState(initial);

  async function remove(id: string, name: string) {
    if (!confirm(`Hapus ${name} dari daftar teman?`)) return;
    setFriends((prev) => prev.filter((f) => f.id !== id));
    const res = await fetch(`/api/friends/${id}`, { method: "DELETE" });
    if (!res.ok) toast.error("Gagal menghapus teman");
    else toast.success("Teman dihapus");
  }

  if (friends.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-[13px] text-muted-foreground">Belum ada teman.</p>
        <p className="mt-1 text-[12px] text-muted-foreground/70">
          Undang teman lewat kode di atas untuk mulai saling menguatkan.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle bg-surface">
      {friends.map((f) => (
        <li key={f.id} className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/12 text-[12px] font-bold text-primary">
            {f.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold text-heading">{f.name}</p>
          </div>
          <a
            href={`/app/teman/${f.id}/kirim-ayat`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary active:scale-95 transition-transform"
            aria-label={`Kirim ayat ke ${f.name}`}
          >
            <LivynSend className="h-4 w-4" />
          </a>
          <button
            onClick={() => remove(f.id, f.name)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-muted-foreground active:scale-95 transition-transform"
            aria-label={`Hapus ${f.name}`}
          >
            <LivynUserMinus className="h-4 w-4" />
          </button>
        </li>
      ))}
    </ul>
  );
}
