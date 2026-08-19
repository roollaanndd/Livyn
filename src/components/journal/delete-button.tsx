"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LivynTrash } from "@/components/icons/livyn-icons";

export function DeleteJournalButton({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("Hapus catatan ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/jurnal/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Gagal menghapus catatan");
        return;
      }
      toast.success("Catatan dihapus");
      router.replace("/app/jurnal");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={remove}
      disabled={loading}
      className="rounded-full p-2 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
      aria-label="Hapus catatan"
    >
      <LivynTrash className="h-5 w-5" />
    </button>
  );
}
