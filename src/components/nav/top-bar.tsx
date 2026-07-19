"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopBar({
  title,
  back,
  actions,
  className,
}: {
  title?: string;
  back?: boolean;
  actions?: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-md",
        className,
      )}
    >
      {back && (
        <button onClick={() => router.back()} className="rounded-full p-1.5 hover:bg-surface-muted" aria-label="Kembali">
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      {title && <h1 className="font-display flex-1 truncate text-[17px] font-bold">{title}</h1>}
      {!title && <div className="flex-1" />}
      {actions}
    </header>
  );
}

export function IconLink({ href, children, label }: { href: string; children: React.ReactNode; label: string }) {
  return (
    <Link href={href} aria-label={label} className="rounded-full p-2 hover:bg-surface-muted">
      {children}
    </Link>
  );
}
