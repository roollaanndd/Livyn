"use client";

import { useState } from "react";
import { toast } from "sonner";
import { LivynPlus, LivynTrash } from "@/components/icons/livyn-icons";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type CategoryRow = { id: string; name: string; slug: string; devotionCount: number; sermonCount: number };

export function CategoryManager({ initialCategories, canEdit }: { initialCategories: CategoryRow[]; canEdit: boolean }) {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState("");

  async function addCategory() {
    if (!name.trim()) return;
    const res = await fetch("/api/admin/kategori", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Gagal menambah kategori");
      return;
    }
    setCategories((prev) => [...prev, { ...data.category, devotionCount: 0, sermonCount: 0 }]);
    setName("");
    toast.success("Kategori ditambahkan");
  }

  async function removeCategory(id: string) {
    const res = await fetch(`/api/admin/kategori/${id}`, { method: "DELETE" });
    if (res.ok) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      toast.success("Kategori dihapus");
    }
  }

  return (
    <div>
      {canEdit && (
        <div className="mb-5 flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kategori baru" />
          <Button onClick={addCategory}><LivynPlus className="h-4 w-4" /> Tambah</Button>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((c) => (
          <Card key={c.id} className="flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">{c.devotionCount} renungan · {c.sermonCount} khotbah</p>
            </div>
            {canEdit && (
              <button onClick={() => removeCategory(c.id)} className="rounded-full p-2 text-red-500 hover:bg-red-500/10" aria-label="Hapus">
                <LivynTrash className="h-4 w-4" />
              </button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
