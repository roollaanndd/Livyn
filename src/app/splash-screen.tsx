"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LivynMark, LivynWordmark } from "@/components/brand/logo";
import { useAuth } from "@/components/providers/auth-provider";

export function SplashScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready || loading || exiting) return;

    setExiting(true);
    const timeout = setTimeout(() => {
      if (user) {
        router.replace("/app");
      } else {
        const onboarded = localStorage.getItem("livyn_onboarded");
        router.replace(onboarded ? "/masuk" : "/onboarding");
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [ready, loading, user, router, exiting]);

  return (
    <motion.div
      animate={exiting ? { opacity: 0, scale: 0.96 } : { opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#0B0D1A] text-white overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#6C5CE7]/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-[#6EE7C1]/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 h-24 w-24"
      >
        <LivynMark className="h-full w-full drop-shadow-[0_0_40px_rgba(108,92,231,0.55)]" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="relative z-10 mt-5"
      >
        <LivynWordmark className="text-3xl text-white" />
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="relative z-10 mt-2 text-sm tracking-[0.3em] text-white/60"
      >
        FAITH. EVERY DAY.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: exiting ? 0 : 1 }}
        transition={{ delay: exiting ? 0 : 1.3 }}
        className="absolute bottom-14 flex items-center gap-1.5"
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-white/70"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}
