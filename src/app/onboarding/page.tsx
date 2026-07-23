"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LivynMark, LivynWordmark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    id: "welcome",
    illustration: "leaf",
    badge: null,
    title: "Selamat Datang di Livyn",
    body: "Aplikasi yang dirancang khusus untuk menemanimu bertumbuh lebih dekat dengan Yesus — setiap hari, setiap langkah.",
    gradient: "from-[#E8F5E9] via-[#F1F8E9] to-[#E0F2F1]",
    accent: "#2E7D52",
    textColor: "text-[#1B4332]",
    bodyColor: "text-[#1B4332]/65",
    dotActive: "bg-[#2E7D52]",
    dotInactive: "bg-[#2E7D52]/20",
    btnBg: "bg-[#2E7D52]",
    btnText: "text-white",
  },
  {
    id: "why",
    illustration: "sunrise",
    badge: "Mengapa Livyn?",
    title: "Lebih dari Sekadar Aplikasi",
    body: "Di tengah dunia yang penuh distraksi, Livyn hadir sebagai ruang tenang — tanpa like, tanpa scroll tanpa akhir. Hanya kamu dan Tuhan.",
    gradient: "from-[#FFF8E1] via-[#FFFDE7] to-[#FFF3E0]",
    accent: "#E6A817",
    textColor: "text-[#5D4037]",
    bodyColor: "text-[#5D4037]/60",
    dotActive: "bg-[#E6A817]",
    dotInactive: "bg-[#E6A817]/20",
    btnBg: "bg-[#E6A817]",
    btnText: "text-white",
  },
  {
    id: "bible",
    illustration: "book",
    badge: "Alkitab",
    title: "Firman Tuhan di Ujung Jari",
    body: "Alkitab lengkap 66 kitab dengan penanda ayat, catatan pribadi, dan pencarian cepat. Baca dimanapun kamu berada.",
    gradient: "from-[#E3F2FD] via-[#E8EAF6] to-[#E1F5FE]",
    accent: "#1976D2",
    textColor: "text-[#1A237E]",
    bodyColor: "text-[#1A237E]/60",
    dotActive: "bg-[#1976D2]",
    dotInactive: "bg-[#1976D2]/20",
    btnBg: "bg-[#1976D2]",
    btnText: "text-white",
  },
  {
    id: "devotion",
    illustration: "heart",
    badge: "Renungan",
    title: "Renungan yang Menyentuh Hati",
    body: "Renungan harian berdasarkan topik hidupmu — kecemasan, keluarga, pekerjaan, pengampunan. Ditulis dengan kasih untuk musim hidupmu.",
    gradient: "from-[#FCE4EC] via-[#FFF0F5] to-[#F3E5F5]",
    accent: "#D81B60",
    textColor: "text-[#4A0E2B]",
    bodyColor: "text-[#4A0E2B]/60",
    dotActive: "bg-[#D81B60]",
    dotInactive: "bg-[#D81B60]/20",
    btnBg: "bg-[#D81B60]",
    btnText: "text-white",
  },
  {
    id: "prayer",
    illustration: "pray",
    badge: "Doa",
    title: "Tak Pernah Lewatkan Waktu Doa",
    body: "Atur pengingat doa pagi, siang, malam. Lacak streak doamu dan biarkan ayat penguat menguatkanmu setiap hari.",
    gradient: "from-[#E0F7FA] via-[#E0F2F1] to-[#E8F5E9]",
    accent: "#00897B",
    textColor: "text-[#004D40]",
    bodyColor: "text-[#004D40]/60",
    dotActive: "bg-[#00897B]",
    dotInactive: "bg-[#00897B]/20",
    btnBg: "bg-[#00897B]",
    btnText: "text-white",
  },
  {
    id: "ai",
    illustration: "sparkle",
    badge: "AI Pastor",
    title: "Pendamping Rohani Pribadimu",
    body: "Tanyakan apa saja tentang iman, Alkitab, atau pergumulanmu. AI Pastor hadir 24/7 untuk membimbingmu dengan kasih dan hikmat.",
    gradient: "from-[#EDE7F6] via-[#E8EAF6] to-[#F3E5F5]",
    accent: "#7B1FA2",
    textColor: "text-[#311B47]",
    bodyColor: "text-[#311B47]/60",
    dotActive: "bg-[#7B1FA2]",
    dotInactive: "bg-[#7B1FA2]/20",
    btnBg: "bg-[#7B1FA2]",
    btnText: "text-white",
  },
  {
    id: "ready",
    illustration: "mountain",
    badge: null,
    title: "Perjalananmu Dimulai",
    body: "Ribuan orang telah bertumbuh bersama Livyn. Sekarang giliranmu. Mari mulai perjalanan iman yang luar biasa ini.",
    gradient: "from-[#E8F5E9] via-[#F1F8E9] to-[#DCEDC8]",
    accent: "#2E7D52",
    textColor: "text-[#1B4332]",
    bodyColor: "text-[#1B4332]/65",
    dotActive: "bg-[#2E7D52]",
    dotInactive: "bg-[#2E7D52]/20",
    btnBg: "bg-[#2E7D52]",
    btnText: "text-white",
  },
];

function SlideIllustration({ type, accent }: { type: string; accent: string }) {
  const base = "h-32 w-32";
  const illustrations: Record<string, React.ReactNode> = {
    leaf: (
      <div className={cn(base, "relative")}>
        <div
          className="absolute inset-0 scale-125 rounded-full blur-2xl"
          style={{ background: `${accent}15` }}
        />
        <LivynMark className="relative h-full w-full drop-shadow-[0_0_24px_rgba(46,125,82,0.3)]" gradientId="onb-leaf" />
      </div>
    ),
    sunrise: (
      <div className={cn(base, "relative flex items-end justify-center")}>
        <svg viewBox="0 0 120 80" className="w-full" fill="none">
          <defs>
            <linearGradient id="sun-grad" x1="60" y1="0" x2="60" y2="80">
              <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="45" r="18" fill={accent} opacity="0.85" />
          <path d="M0 60 Q30 35, 60 50 Q90 65, 120 45 L120 80 L0 80Z" fill="url(#sun-grad)" opacity="0.4" />
          <path d="M0 70 Q40 50, 70 60 Q100 70, 120 55 L120 80 L0 80Z" fill={accent} opacity="0.25" />
          {[35, 45, 55, 65, 75, 85].map((a, i) => (
            <line key={i} x1="60" y1="45" x2={60 + Math.cos((a * Math.PI) / 180) * 30} y2={45 - Math.sin((a * Math.PI) / 180) * 30} stroke={accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          ))}
        </svg>
      </div>
    ),
    book: (
      <div className={cn(base, "relative flex items-center justify-center")}>
        <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none">
          <path d="M12 16C12 14 14 12 16 12H36C38 12 40 14 40 16V64C40 66 38 68 36 68H16C14 68 12 66 12 64V16Z" fill={accent} opacity="0.3" stroke={accent} strokeWidth="1.5" />
          <path d="M40 16C40 14 42 12 44 12H64C66 12 68 14 68 16V64C68 66 66 68 64 68H44C42 68 40 66 40 64V16Z" fill={accent} opacity="0.2" stroke={accent} strokeWidth="1.5" />
          <line x1="40" y1="12" x2="40" y2="68" stroke={accent} strokeWidth="2.5" />
          {[24, 32, 40].map((y, i) => (
            <line key={i} x1="18" y1={y} x2="34" y2={y} stroke={accent} strokeWidth="1.5" opacity="0.5" />
          ))}
        </svg>
      </div>
    ),
    heart: (
      <div className={cn(base, "relative flex items-center justify-center")}>
        <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none">
          <path d="M40 68S10 48 10 30C10 18 20 10 30 10C35 10 38 12 40 16C42 12 45 10 50 10C60 10 70 18 70 30C70 48 40 68 40 68Z" fill={accent} opacity="0.35" stroke={accent} strokeWidth="2" />
        </svg>
      </div>
    ),
    pray: (
      <div className={cn(base, "relative flex items-center justify-center")}>
        <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none">
          <path d="M30 55L35 30C36 25 38 22 40 22C42 22 44 25 45 30L50 55" stroke={accent} strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
          <path d="M28 55C28 55 32 50 40 50C48 50 52 55 52 55" stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
          <circle cx="40" cy="16" r="3.5" fill={accent} opacity="0.6" />
          {[0, 1, 2].map((i) => (
            <circle key={i} cx={34 + i * 6} cy={10 - i * 2} r="1.5" fill={accent} opacity={0.4 + i * 0.1} />
          ))}
        </svg>
      </div>
    ),
    sparkle: (
      <div className={cn(base, "relative flex items-center justify-center")}>
        <svg viewBox="0 0 80 80" className="h-24 w-24" fill="none">
          <path d="M40 10L44 30L64 26L48 38L64 50L44 46L40 66L36 46L16 50L32 38L16 26L36 30L40 10Z" fill={accent} opacity="0.4" stroke={accent} strokeWidth="1.5" />
          <circle cx="40" cy="38" r="7" fill={accent} opacity="0.6" />
          <circle cx="22" cy="18" r="2.5" fill={accent} opacity="0.4" />
          <circle cx="60" cy="62" r="3" fill={accent} opacity="0.35" />
          <circle cx="62" cy="16" r="2" fill={accent} opacity="0.3" />
        </svg>
      </div>
    ),
    mountain: (
      <div className={cn(base, "relative flex items-end justify-center")}>
        <svg viewBox="0 0 120 80" className="w-full" fill="none">
          <path d="M0 80L30 30L50 55L75 15L120 80Z" fill={accent} opacity="0.25" />
          <path d="M0 80L45 40L65 58L90 25L120 80Z" fill={accent} opacity="0.15" />
          <circle cx="90" cy="18" r="8" fill={accent} opacity="0.55" />
        </svg>
      </div>
    ),
  };
  return <>{illustrations[type]}</>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [entering, setEntering] = useState(false);
  const [direction, setDirection] = useState(1);
  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const enterApp = useCallback(() => {
    if (entering) return;
    setEntering(true);
    localStorage.setItem("livyn_onboarded", "1");
    router.replace("/masuk");
  }, [entering, router]);

  function next() {
    if (isLast) {
      enterApp();
    } else {
      setDirection(1);
      setIndex((i) => i + 1);
    }
  }

  function prev() {
    if (index > 0) {
      setDirection(-1);
      setIndex((i) => i - 1);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "fixed inset-0 flex flex-col transition-all duration-700 ease-out bg-gradient-to-br",
        slide.gradient,
      )}
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 0.8 }}
          className="absolute top-1/4 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${slide.accent}25 0%, transparent 70%)` }}
        />
        <motion.div
          key={`${slide.id}-b`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.25 }}
          transition={{ duration: 1 }}
          className="absolute -bottom-16 -right-16 h-64 w-64 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${slide.accent}20 0%, transparent 70%)` }}
        />
      </div>

      {/* Skip button */}
      <div className="relative z-20 flex justify-end p-5 safe-top">
        {!isLast && (
          <button
            onClick={enterApp}
            disabled={entering}
            className={cn("text-sm font-medium transition-colors disabled:opacity-50", slide.bodyColor)}
          >
            Lewati
          </button>
        )}
      </div>

      {/* Content */}
      <div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center"
        onPointerDown={(e) => {
          const startX = e.clientX;
          const handler = (ev: PointerEvent) => {
            const diff = ev.clientX - startX;
            if (Math.abs(diff) > 50) {
              if (diff < 0) next();
              else prev();
              document.removeEventListener("pointerup", handler);
            }
          };
          document.addEventListener("pointerup", handler, { once: true });
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={index}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -direction * 60, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col items-center"
          >
            {/* Illustration */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mb-10"
            >
              <SlideIllustration type={slide.illustration} accent={slide.accent} />
            </motion.div>

            {/* Badge */}
            {slide.badge && (
              <motion.span
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="mb-3 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
                style={{ background: `${slide.accent}18`, color: slide.accent }}
              >
                {slide.badge}
              </motion.span>
            )}

            {/* Title */}
            <h1 className={cn("font-display max-w-[320px] text-[26px] font-bold leading-[1.2] tracking-tight", slide.textColor)}>
              {slide.title}
            </h1>

            {/* Body */}
            <p className={cn("mt-4 max-w-[300px] text-[15px] leading-[1.65]", slide.bodyColor)}>
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom section */}
      <div className="relative z-20 px-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        {/* Progress dots */}
        <div className="mb-7 flex items-center justify-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setDirection(i > index ? 1 : -1);
                setIndex(i);
              }}
              aria-label={`Slide ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === index ? cn("w-7", slide.dotActive) : cn("w-1.5", slide.dotInactive),
              )}
            />
          ))}
        </div>

        {/* CTA button */}
        <Button
          onClick={next}
          size="lg"
          className={cn("w-full rounded-2xl font-bold shadow-lg shadow-black/10 hover:opacity-90 h-[52px] text-[15px]", slide.btnBg, slide.btnText)}
          disabled={entering}
        >
          {entering ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isLast ? (
            "Mulai Perjalananmu"
          ) : (
            "Lanjut"
          )}
        </Button>
      </div>
    </motion.div>
  );
}
