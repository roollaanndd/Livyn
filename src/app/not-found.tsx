import Link from "next/link";
import { LivynMapPin } from "@/components/icons/livyn-icons";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center font-sans">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft">
        <LivynMapPin className="h-8 w-8 text-primary" />
      </div>
      <h2 className="mt-5 font-display text-xl font-bold text-heading">Halaman tidak ditemukan</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Tautan ini mungkin sudah tidak berlaku. Yuk kembali ke beranda.
      </p>
      <Link
        href="/app"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Kembali ke Livyn
      </Link>
    </div>
  );
}
