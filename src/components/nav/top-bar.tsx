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
  transparent,
}: {
  title?: string;
  back?: boolean;
  actions?: React.ReactNode;
  className?: string;
  transparent?: boolean;
}) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[56px] items-center gap-3 px-5",
        transparent
          ? "bg-transparent"
          : "glass-heavy border-b border-border-subtle",
        className,
      )}
    >
      {back && (
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted/80 hover:bg-surface-muted transition-colors active:scale-95"
          aria-label="Kembali"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
        </button>
      )}
      {title && (
        <h1 className="font-display flex-1 truncate text-[17px] font-extrabold text-heading">{title}</h1>
      )}
      {!title && <div className="flex-1" />}
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  );
}

export function IconLink({ href, children, label }: { href: string; children: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-2xl hover:bg-surface-muted transition-colors active:scale-95"
    >
      {children}
    </Link>
  );
}
