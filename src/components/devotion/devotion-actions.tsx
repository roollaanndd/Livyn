"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck, Share2, DownloadCloud, CloudCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function DevotionActions({
  devotionId,
  initialBookmarked,
  title,
  slug,
  offlinePayload,
}: {
  devotionId: string;
  initialBookmarked: boolean;
  title: string;
  slug: string;
  offlinePayload: unknown;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [savedOffline, setSavedOffline] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`livyn_offline_devosi_${slug}`);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is browser-only, unreadable during SSR
    setSavedOffline(!!saved);
  }, [slug]);

  async function toggleBookmark() {
    setPending(true);
    try {
      const res = await fetch(`/api/devosi/${devotionId}/bookmark`, { method: "POST" });
      const data = await res.json();
      setBookmarked(data.bookmarked);
      toast.success(data.bookmarked ? "Disimpan ke bookmark" : "Dihapus dari bookmark");
    } catch {
      toast.error("Gagal menyimpan bookmark");
    } finally {
      setPending(false);
    }
  }

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Tautan disalin ke clipboard");
    }
  }

  function saveOffline() {
    localStorage.setItem(`livyn_offline_devosi_${slug}`, JSON.stringify(offlinePayload));
    setSavedOffline(true);
    toast.success("Renungan tersedia offline");
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleBookmark}
        disabled={pending}
        aria-label="Simpan"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          bookmarked ? "bg-primary/10 text-primary" : "bg-surface-muted text-muted-foreground",
        )}
      >
        {bookmarked ? <BookmarkCheck className="h-4.5 w-4.5" /> : <Bookmark className="h-4.5 w-4.5" />}
      </button>
      <button onClick={share} aria-label="Bagikan" className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
        <Share2 className="h-4.5 w-4.5" />
      </button>
      <button
        onClick={saveOffline}
        disabled={savedOffline}
        aria-label="Simpan offline"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full",
          savedOffline ? "bg-accent/15 text-accent" : "bg-surface-muted text-muted-foreground",
        )}
      >
        {savedOffline ? <CloudCheck className="h-4.5 w-4.5" /> : <DownloadCloud className="h-4.5 w-4.5" />}
      </button>
    </div>
  );
}
