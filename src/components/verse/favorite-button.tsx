"use client";

import { useState } from "react";
import { LivynBookmark, LivynBookmarkCheck, LivynSpinner } from "@/components/icons/livyn-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

export type FavoriteTarget = {
  bookCode: string;
  bookName: string;
  chapter: number;
  verse: number;
  text: string;
};

/** `chip` sits on the dark verse hero, `icon` sits inline in the Bible reader. */
export function FavoriteButton({
  target,
  initialFavorited,
  variant = "chip",
  className,
}: {
  target: FavoriteTarget;
  initialFavorited: boolean;
  variant?: "chip" | "icon";
  className?: string;
}) {
  const t = useT();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    setPending(true);
    const next = !favorited;
    setFavorited(next); // optimistic

    const res = await fetch("/api/favorit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(target),
    }).catch(() => null);

    if (!res?.ok) {
      setFavorited(!next);
      toast.error(t("common.errorGeneric"));
      setPending(false);
      return;
    }

    const data = (await res.json().catch(() => null)) as { favorited?: boolean } | null;
    // Trust the server's answer over the optimistic guess — they diverge if the
    // same verse was saved on another device since this page rendered.
    const confirmed = data?.favorited ?? next;
    setFavorited(confirmed);
    toast.success(confirmed ? t("favorites.savedToast") : t("favorites.removedToast"));
    setPending(false);
  }

  const Icon = pending ? LivynSpinner : favorited ? LivynBookmarkCheck : LivynBookmark;

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        disabled={pending}
        aria-pressed={favorited}
        aria-label={favorited ? t("favorites.saved") : t("favorites.save")}
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors active:scale-95",
          favorited ? "text-primary" : "text-muted-foreground/50",
          className,
        )}
      >
        <Icon className={cn("h-4 w-4", pending && "animate-spin")} />
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-pressed={favorited}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold backdrop-blur-sm transition-colors active:scale-95 disabled:opacity-60",
        favorited ? "bg-white/20 text-white" : "bg-white/10 text-white/80",
        className,
      )}
    >
      <Icon className={cn("h-3.5 w-3.5", pending && "animate-spin")} />
      {favorited ? t("favorites.saved") : t("favorites.save")}
    </button>
  );
}
