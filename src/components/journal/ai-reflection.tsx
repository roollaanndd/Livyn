"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { LivynRefresh, LivynAlertCircle } from "@/components/icons/livyn-icons";
import { LivynAiIcon } from "@/components/brand/logo";

function renderReflection(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.trim() === "") return <div key={i} className="h-2" />;
    const parts = line.split(/(\*\*[^*]+\*\*|"[^"]+"\s*-\s*[A-Za-z1-9][^"\n]*)/g);
    return (
      <p key={i} className="mt-1.5 first:mt-0">
        {parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={j} className="font-semibold text-heading">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('"') && /-\s*\S/.test(part)) {
            return (
              <span key={j} className="mt-2 mb-1 block border-l-2 border-primary/40 pl-3 italic text-primary">
                {part}
              </span>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

export function JournalAiReflection({ entryId }: { entryId: string }) {
  const [reflection, setReflection] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const fetchReflection = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    const cacheKey = `livyn-refleksi-${entryId}`;
    if (!force) {
      try {
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
          setReflection(cached);
          setLoading(false);
          return;
        }
      } catch {
        // sessionStorage unavailable
      }
    }

    try {
      const res = await fetch(`/api/jurnal/${entryId}/refleksi`, { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Gagal memuat respon AI Pastor.");
        return;
      }
      setReflection(data.reflection);
      try {
        sessionStorage.setItem(cacheKey, data.reflection);
      } catch {
        // ignore quota errors
      }
    } catch {
      setError("Terjadi kesalahan jaringan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [entryId]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    fetchReflection();
  }, [fetchReflection]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="rounded-2xl border border-primary/15 bg-primary-soft/40 p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
            <LivynAiIcon className="h-4.5 w-4.5" />
          </div>
          <span className="text-[12px] font-bold uppercase tracking-wider text-primary">
            Respon AI Pastor
          </span>
        </div>
        {!loading && (
          <button
            onClick={() => fetchReflection(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-muted active:scale-95"
            aria-label="Buat ulang respon"
          >
            <LivynRefresh className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2.5 py-1">
          <div className="flex items-center gap-1.5 pb-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-2 w-2 rounded-full bg-primary/50"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
              />
            ))}
            <span className="ml-1 text-[12px] text-muted-foreground">
              AI Pastor sedang membaca ceritamu...
            </span>
          </div>
          <div className="h-3 w-full animate-pulse rounded bg-primary/10" />
          <div className="h-3 w-[85%] animate-pulse rounded bg-primary/10" />
          <div className="h-3 w-[70%] animate-pulse rounded bg-primary/10" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2.5">
          <LivynAlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
          <div>
            <p className="text-[13px] text-muted-foreground">{error}</p>
            <button
              onClick={() => fetchReflection(true)}
              className="mt-1.5 text-[13px] font-semibold text-primary"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      ) : reflection ? (
        <div className="text-[14px] leading-relaxed text-foreground">
          {renderReflection(reflection)}
        </div>
      ) : null}
    </motion.div>
  );
}
