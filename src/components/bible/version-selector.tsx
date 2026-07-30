"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";

interface BibleVersion {
  id: string;
  abbreviation: string;
  name: string;
  nameLocal: string;
}

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
}

export function VersionSelector({ current }: { current: string }) {
  const router = useRouter();
  const [versions, setVersions] = useState<BibleVersion[]>([]);
  // Starts true: the fetch below runs on mount, so the first paint is already
  // the loading state. Setting it from inside the effect only caused an extra
  // render pass to reach the same place.
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/alkitab/versions")
      .then((r) => r.json())
      .then((data) => setVersions(data.versions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = useCallback(
    (abbr: string) => {
      setCookie("bible-version", abbr);
      setOpen(false);
      router.refresh();
    },
    [router],
  );

  if (loading) {
    return (
      <div className="flex h-9 items-center gap-1.5 rounded-xl bg-surface-muted/80 px-3">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (versions.length <= 1) {
    return (
      <div className="flex h-9 items-center rounded-xl bg-primary/10 px-3 text-[12px] font-bold text-primary">
        {current}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-9 items-center gap-1 rounded-xl bg-primary/10 px-3 text-[12px] font-bold text-primary hover:bg-primary/15 transition-colors"
      >
        {current}
        <ChevronDown className="h-3.5 w-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-border bg-surface p-1.5 shadow-lg">
            {versions.map((v) => (
              <button
                key={v.abbreviation}
                onClick={() => handleSelect(v.abbreviation)}
                className={`flex w-full flex-col rounded-lg px-3 py-2.5 text-left transition-colors ${
                  v.abbreviation === current
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-surface-muted text-heading"
                }`}
              >
                <span className="text-[13px] font-semibold">{v.abbreviation}</span>
                <span className="text-[11px] text-muted-foreground">{v.nameLocal || v.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
