"use client";

import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { useAuth } from "@/components/providers/auth-provider";

/**
 * Onboarding is a real, always-reachable route.
 *
 * It used to live as a hidden phase inside the splash screen, gated on a
 * localStorage flag, and this path was a stub that redirected to "/". Once the
 * flag was set there was no way back to it, which is why it went missing. Now
 * the splash sends first-timers here, and "Lihat Panduan Livyn" in the profile
 * can send anyone here at any time.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();

  return (
    // Someone replaying the tour from their profile is already signed in and
    // should land back in the app, not on the login screen.
    <OnboardingFlow onDone={() => router.replace(user ? "/app" : "/masuk")} />
  );
}
