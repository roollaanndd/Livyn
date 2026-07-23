"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return <div className="fixed inset-0 bg-gradient-to-br from-[#E8F5E9] via-[#F1F8E9] to-[#E0F2F1]" />;
}
