"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LivynSpinner } from "@/components/icons/livyn-icons";
import { LivynMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DURATION, EASE_OUT, SPRING_SOFT, TAP } from "@/lib/motion";

/** Set once the user has finished or skipped onboarding. */
export const ONBOARDED_KEY = "livyn_onboarded_v2";

/**
 * Accents are mid-tone on purpose: each one has to stay legible against the
 * app background in both light and dark. Everything else on the slide uses the
 * app's own theme tokens, so onboarding follows the day/night setting instead
 * of being permanently bright the way the old hard-coded gradients were.
 */
const SLIDES = [
  {
    id: "welcome",
    illustration: "leaf",
    badge: null,
    title: "Selamat Datang di Livyn",
    body: "Aplikasi yang dirancang khusus untuk menemanimu bertumbuh lebih dekat dengan Yesus - setiap hari, setiap langkah.",
    accent: "#3FA97A",
  },
  {
    id: "why",
    illustration: "sunrise",
    badge: "Mengapa Livyn?",
    title: "Lebih dari Sekadar Aplikasi",
    body: "Di tengah dunia yang penuh distraksi, Livyn hadir sebagai ruang tenang - tanpa like, tanpa scroll tanpa akhir. Hanya kamu dan Tuhan.",
    accent: "#E0A82E",
  },
  {
    id: "bible",
    illustration: "book",
    badge: "Alkitab",
    title: "Firman Tuhan di Ujung Jari",
    body: "Alkitab lengkap 66 kitab dengan penanda ayat, catatan pribadi, dan pencarian cepat. Baca di mana pun kamu berada.",
    accent: "#4C8DF6",
  },
  {
    id: "devotion",
    illustration: "heart",
    badge: "Renungan",
    title: "Renungan yang Menyentuh Hati",
    body: "Renungan harian berdasarkan topik hidupmu - kecemasan, keluarga, pekerjaan, pengampunan. Ditulis dengan kasih untuk musim hidupmu.",
    accent: "#E8557F",
  },
  {
    id: "prayer",
    illustration: "pray",
    badge: "Doa",
    title: "Tak Pernah Lewatkan Waktu Doa",
    body: "Atur pengingat doa pagi, siang, malam. Lacak streak doamu dan biarkan ayat penguat menemanimu setiap hari.",
    accent: "#2BB3A3",
  },
  {
    id: "ai",
    illustration: "sparkle",
    badge: "AI Pastor",
    title: "Pendamping Rohani Pribadimu",
    body: "Tanyakan apa saja tentang iman, Alkitab, atau pergumulanmu. AI Pastor hadir 24/7 untuk menemanimu dengan kasih dan hikmat.",
    accent: "#A56BD6",
  },
  {
    id: "ready",
    illustration: "mountain",
    badge: null,
    title: "Perjalananmu Dimulai",
    body: "Ribuan orang telah bertumbuh bersama Livyn. Sekarang giliranmu. Mari mulai perjalanan iman ini.",
    accent: "#3FA97A",
  },
];

/**
 * Picks black or white text for a filled accent button.
 *
 * The accents are mid-tone so they work on both themes, which also means white
 * text on them lands around 2-3:1 — below the WCAG AA floor. Deriving the
 * foreground from relative luminance keeps every slide legible, and keeps it
 * correct if an accent is ever retuned.
 */
function readableOn(hex: string): string {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = channel(parseInt(hex.slice(1, 3), 16));
  const g = channel(parseInt(hex.slice(3, 5), 16));
  const b = channel(parseInt(hex.slice(5, 7), 16));
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  const contrastWithWhite = 1.05 / (luminance + 0.05);
  return contrastWithWhite >= 4.5 ? "#FFFFFF" : "#0B1410";
}

function SlideIllustration({ type, accent }: { type: string; accent: string }) {
  const base = "h-36 w-36";
  const illustrations: Record<string, React.ReactNode> = {
    leaf: (
      <div className={cn(base, "relative")}>
        <div className="absolute inset-0 scale-125 rounded-full blur-2xl" style={{ background: `${accent}33` }} />
        <LivynMark className="relative h-full w-full" gradientId="onb-leaf" />
      </div>
    ),
    sunrise: (
      <div className={cn(base, "relative flex items-end justify-center")}>
        <svg viewBox="0 0 120 80" className="w-full" fill="none">
          <defs>
            <linearGradient id="onb-sun-grad" x1="60" y1="0" x2="60" y2="80">
              <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
              <stop offset="100%" stopColor={accent} stopOpacity="0.15" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="45" r="20" fill={accent} opacity="0.85" />
          <path d="M0 60 Q30 35, 60 50 Q90 65, 120 45 L120 80 L0 80Z" fill="url(#onb-sun-grad)" opacity="0.4" />
          <path d="M0 70 Q40 50, 70 60 Q100 70, 120 55 L120 80 L0 80Z" fill={accent} opacity="0.25" />
          {[30, 42, 54, 66, 78, 90].map((a, i) => (
            <line
              key={i}
              x1="60"
              y1="45"
              x2={60 + Math.cos((a * Math.PI) / 180) * 32}
              y2={45 - Math.sin((a * Math.PI) / 180) * 32}
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.45"
            />
          ))}
        </svg>
      </div>
    ),
    book: (
      <div className={cn(base, "relative flex items-center justify-center")}>
        <svg viewBox="0 0 80 80" className="h-28 w-28" fill="none">
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
        <svg viewBox="0 0 80 80" className="h-28 w-28" fill="none">
          <path d="M40 68S10 48 10 30C10 18 20 10 30 10C35 10 38 12 40 16C42 12 45 10 50 10C60 10 70 18 70 30C70 48 40 68 40 68Z" fill={accent} opacity="0.35" stroke={accent} strokeWidth="2" />
        </svg>
      </div>
    ),
    pray: (
      <div className={cn(base, "relative flex items-center justify-center")}>
        <svg viewBox="0 0 80 80" className="h-28 w-28" fill="none">
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
        <svg viewBox="0 0 80 80" className="h-28 w-28" fill="none">
          <path d="M40 10L44 30L64 26L48 38L64 50L44 46L40 66L36 46L16 50L32 38L16 26L36 30L40 10Z" fill={accent} opacity="0.4" stroke={accent} strokeWidth="1.5" />
          <circle cx="40" cy="38" r="8" fill={accent} opacity="0.6" />
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

/** How far the user has to drag before it counts as a swipe. */
const SWIPE_DISTANCE = 60;
const SWIPE_VELOCITY = 300;

export function OnboardingFlow({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [leaving, setLeaving] = useState(false);

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= SLIDES.length) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index],
  );

  const finish = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {
      // Private mode — proceeding without remembering is better than blocking.
    }
    onDone();
  }, [leaving, onDone]);

  function next() {
    if (isLast) finish();
    else goTo(index + 1);
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      {/* Ambient accent wash — cross-fades as the slide changes. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <AnimatePresence>
          <motion.div
            key={slide.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.slow, ease: EASE_OUT }}
            className="absolute inset-0"
          >
            <div
              className="absolute left-1/2 top-[22%] h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${slide.accent}2E 0%, transparent 70%)` }}
            />
            <div
              className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full blur-3xl"
              style={{ background: `radial-gradient(circle, ${slide.accent}24 0%, transparent 70%)` }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="relative z-20 flex items-center justify-between p-5 safe-top">
        <span className="text-[12px] font-semibold tabular-nums text-muted-foreground/70">
          {index + 1}/{SLIDES.length}
        </span>
        {!isLast && (
          <button
            onClick={finish}
            disabled={leaving}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Lewati
          </button>
        )}
      </div>

      <motion.div
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-8 text-center"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          const far = Math.abs(info.offset.x) > SWIPE_DISTANCE;
          const fast = Math.abs(info.velocity.x) > SWIPE_VELOCITY;
          if (!far && !fast) return;
          if (info.offset.x < 0) next();
          else goTo(index - 1);
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={slide.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 48 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -direction * 48 }}
            transition={{ duration: DURATION.normal, ease: EASE_OUT }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0.86, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ ...SPRING_SOFT, delay: 0.06 }}
              className="mb-10"
            >
              <SlideIllustration type={slide.illustration} accent={slide.accent} />
            </motion.div>

            {slide.badge && (
              <motion.span
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: DURATION.quick, ease: EASE_OUT }}
                className="mb-3 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-heading"
                style={{ background: `${slide.accent}24` }}
              >
                {/* The accent reads as a dot rather than as text: the same hue
                    used for 11px type falls below AA on the light background. */}
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: slide.accent }} />
                {slide.badge}
              </motion.span>
            )}

            <h1 className="font-display max-w-[320px] text-[28px] font-extrabold leading-[1.15] tracking-tight text-heading">
              {slide.title}
            </h1>
            <p className="mt-4 max-w-[300px] text-[15px] leading-[1.7] text-muted-foreground">
              {slide.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="relative z-20 px-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="mb-7 flex items-center justify-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              aria-label={`Ke slide ${i + 1}`}
              aria-current={i === index}
              className="group py-2"
            >
              <motion.span
                className="block h-2 rounded-full"
                animate={{
                  width: i === index ? 32 : 8,
                  backgroundColor: i === index ? slide.accent : `${slide.accent}33`,
                }}
                transition={SPRING_SOFT}
              />
            </button>
          ))}
        </div>

        <motion.div whileTap={leaving ? undefined : TAP}>
          <Button
            onClick={next}
            size="lg"
            disabled={leaving}
            className="h-[56px] w-full rounded-2xl text-[16px] font-bold shadow-lg transition-opacity hover:opacity-90"
            style={{
              backgroundColor: slide.accent,
              color: readableOn(slide.accent),
              boxShadow: `0 8px 24px ${slide.accent}38`,
            }}
          >
            {leaving ? (
              <LivynSpinner className="h-5 w-5 animate-spin" />
            ) : isLast ? (
              "Mulai Perjalananmu"
            ) : (
              "Lanjut"
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
