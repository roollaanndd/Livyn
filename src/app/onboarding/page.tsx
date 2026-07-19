"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, HandHeart, Clapperboard, Sparkles, AlarmClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    icon: BookOpenText,
    title: "Baca Firman Tuhan Setiap Hari",
    body: "Alkitab lengkap 66 kitab, renungan harian, dan pengingat lembut supaya kebiasaan rohanimu tetap terjaga.",
    bg: "from-[#6C5CE7] to-[#4b3fc4]",
  },
  {
    icon: Sparkles,
    title: "Renungan Berdasarkan Topikmu",
    body: "Kecemasan, keluarga, pekerjaan, pengampunan, atau iman — temukan renungan yang relevan dengan musim hidupmu.",
    bg: "from-[#A78BFA] to-[#6C5CE7]",
  },
  {
    icon: AlarmClock,
    title: "Jangan Lewatkan Waktu Doa",
    body: "Atur alarm doa pagi, siang, malam, atau tengah malam — lengkap dengan ayat penguat dan pencatat streak doamu.",
    bg: "from-[#0B0D1A] to-[#2b2f4a]",
  },
  {
    icon: Clapperboard,
    title: "Dengarkan Khotbah Kapan Saja",
    body: "Streaming khotbah dari gembala tepercaya, tersedia offline, dengan transkrip dan mode audio saja.",
    bg: "from-[#6EE7C1] to-[#2fae87]",
  },
  {
    icon: HandHeart,
    title: "Bertumbuh, Bukan Sekadar Scroll",
    body: "Tanpa like, tanpa followers, tanpa scroll tanpa akhir. Livyn dirancang untuk membentuk kebiasaan rohani, bukan mencuri waktumu.",
    bg: "from-[#4b3fc4] to-[#0B0D1A]",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [index, setIndex] = useState(0);
  const [entering, setEntering] = useState(false);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  async function enterApp() {
    if (entering) return;
    setEntering(true);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error ?? "Gagal masuk ke Livyn. Coba lagi nanti.");
        setEntering(false);
        return;
      }
      localStorage.setItem("livyn_onboarded", "1");
      await refresh();
      router.replace("/app");
    } catch {
      toast.error("Terjadi kesalahan jaringan. Periksa koneksi internet Anda.");
      setEntering(false);
    }
  }

  function next() {
    if (isLast) enterApp();
    else setIndex((i) => i + 1);
  }

  return (
    <div className={cn("fixed inset-0 flex flex-col bg-gradient-to-br text-white transition-colors duration-700", slide.bg)}>
      <div className="flex justify-end p-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <button
          onClick={enterApp}
          disabled={entering}
          className="text-sm font-medium text-white/70 hover:text-white transition-colors disabled:opacity-50"
        >
          Lewati
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-white/15 backdrop-blur-sm">
              <slide.icon className="h-11 w-11" strokeWidth={1.6} />
            </div>
            <h1 className="font-display max-w-sm text-2xl font-bold leading-snug">{slide.title}</h1>
            <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-white/75">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mb-7 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Ke slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-white" : "w-1.5 bg-white/35",
              )}
            />
          ))}
        </div>
        <Button
          onClick={next}
          size="lg"
          className="w-full bg-white text-[#0B0D1A] hover:bg-white/90 shadow-lg shadow-black/20"
          disabled={entering}
        >
          {entering ? <Loader2 className="h-4 w-4 animate-spin" /> : isLast ? "Mulai Sekarang" : "Lanjut"}
        </Button>
      </div>
    </div>
  );
}
