"use client";

import { PageTransition } from "@/components/page-transition";

export default function ContributorTemplate({ children }: { children: React.ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
