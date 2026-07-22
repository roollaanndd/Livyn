"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LivynMark, LivynWordmark } from "@/components/brand/logo";
import { useAuth } from "@/components/providers/auth-provider";

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rand = seededRandom(42);
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  x: rand() * 100,
  y: rand() * 100,
  size: 2 + rand() * 4,
  delay: rand() * 2,
  duration: 3 + rand() * 3,
}));

const VERSE = "Akulah terang dunia";
const VERSE_REF = "Yohanes 8:12";

const MAX_WAIT_MS = 5000;

export function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  const canProceed = !loading || timedOut;

  const navigate = useCallback(() => {
    if (user) {
      router.replace("/app");
    } else {
      const onboarded = typeof window !== "undefined" && localStorage.getItem("livyn_onboarded");
      router.replace(onboarded ? "/masuk" : "/onboarding");
    }
  }, [user, router]);

  useEffect(() => {
    if (!ready || !canProceed || exiting) return;
    setExiting(true);
    const timeout = setTimeout(navigate, 600);
    return () => clearTimeout(timeout);
  }, [ready, canProceed, exiting, navigate]);

  return (
    <AnimatePresence>
      <motion.div
        animate={exiting ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0A1610 0%, #0F1D17 40%, #152820 70%, #0D1512 100%)" }}
      >
        {/* Ambient light orbs */}
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

        {/* Floating particles */}
        <div className="pointer-events-none absolute inset-0">
          {PARTICLES.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-white/20"
              style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
              animate={{
                y: [-10, -30, -10],
                opacity: [0, 0.6, 0],
                scale: [0.8, 1, 0.8],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Logo mark with glow */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10"
        >
          <div className="absolute inset-0 scale-150 blur-3xl">
            <div className="h-full w-full rounded-full bg-primary/20" />
          </div>
          <LivynMark className="relative h-24 w-24 drop-shadow-[0_0_40px_rgba(45,125,95,0.5)]" gradientId="splash-mark" />
        </motion.div>

        {/* Wordmark */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mt-5"
        >
          <LivynWordmark className="text-3xl text-white" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="relative z-10 mt-2.5 text-[11px] font-medium tracking-[0.35em] text-white/40 uppercase"
        >
          Faith. Every Day. Every Step.
        </motion.p>

        {/* Scripture verse */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="relative z-10 mt-10 flex flex-col items-center"
        >
          <p className="font-display text-sm font-medium text-white/50 italic">
            &ldquo;{VERSE}&rdquo;
          </p>
          <p className="mt-1 text-[11px] text-primary/70 font-medium">{VERSE_REF}</p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ delay: exiting ? 0 : 1.4 }}
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
      </motion.div>
    </AnimatePresence>
  );
}
