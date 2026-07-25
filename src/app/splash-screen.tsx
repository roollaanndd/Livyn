"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LivynMark, LivynWordmark } from "@/components/brand/logo";
import { useAuth } from "@/components/providers/auth-provider";
import { ONBOARDED_KEY } from "@/components/onboarding/onboarding-flow";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  x: rand() * 100,
  y: rand() * 100,
  size: 2 + rand() * 4,
  delay: rand() * 2,
  duration: 3 + rand() * 3,
}));

const VERSE = "Akulah terang dunia";
const VERSE_REF = "Yohanes 8:12";

const MAX_WAIT_MS = 2500;

export function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [splashReady, setSplashReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  // A ref, not state: the splash looks identical before and after we start
  // navigating, so flipping state here only bought a cascading re-render.
  const navigated = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setSplashReady(true), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  const canProceed = !loading || timedOut;

  useEffect(() => {
    if (!splashReady || !canProceed || navigated.current) return;
    navigated.current = true;

    if (user) {
      router.replace("/app");
      return;
    }

    // Onboarding is its own route now, so it can also be opened again later
    // from the profile. The flag only decides whether it shows automatically.
    let onboarded = false;
    try {
      onboarded = localStorage.getItem(ONBOARDED_KEY) != null;
    } catch {
      // Private mode — treat as a first visit.
    }

    router.replace(onboarded ? "/masuk" : "/onboarding");
  }, [splashReady, canProceed, user, router]);

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(160deg, #0A1610 0%, #0F1D17 40%, #152820 70%, #0D1512 100%)" }}
      >
            <div className="pointer-events-none absolute inset-0">
              <motion.div
                className="absolute -top-20 -left-20 h-64 w-64 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(45,125,95,0.25) 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(200,155,60,0.15) 0%, transparent 70%)" }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              />
              <motion.div
                className="absolute top-1/3 right-10 h-40 w-40 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(76,175,125,0.12) 0%, transparent 70%)" }}
                animate={{ scale: [0.9, 1.05, 0.9], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              />
            </div>

            <div className="pointer-events-none absolute inset-0">
              {PARTICLES.map((p) => (
                <motion.div
                  key={p.id}
                  className="absolute rounded-full bg-white/20"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
                  animate={{ y: [-10, -30, -10], opacity: [0, 0.6, 0], scale: [0.8, 1, 0.8] }}
                  transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10"
            >
              <div className="absolute inset-0 scale-150 blur-3xl">
                <div className="h-full w-full rounded-full bg-primary/20" />
              </div>
              <LivynMark className="relative h-28 w-28 drop-shadow-[0_0_40px_rgba(45,125,95,0.5)]" gradientId="splash-mark" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 mt-5"
            >
              <LivynWordmark className="text-3xl text-white" />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="relative z-10 mt-2.5 text-[11px] font-medium tracking-[0.35em] text-white/40 uppercase"
            >
              Faith. Every Day. Every Step.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.7 }}
              className="relative z-10 mt-12 flex flex-col items-center"
            >
              <p className="font-display text-sm font-medium text-white/50 italic">
                &ldquo;{VERSE}&rdquo;
              </p>
              <p className="mt-1.5 text-[11px] text-primary/70 font-medium">{VERSE_REF}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="absolute bottom-16 flex items-center gap-2"
            >
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-1 w-1 rounded-full bg-primary/60"
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
                />
              ))}
            </motion.div>
      </div>
    </div>
  );
}
