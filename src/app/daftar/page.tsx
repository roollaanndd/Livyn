"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Temporarily disabled — onboarding signs visitors straight into the demo
// account, so this route just sends anyone who lands here back into that flow.
export default function RegisterPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding");
  }, [router]);
  return null;
}
