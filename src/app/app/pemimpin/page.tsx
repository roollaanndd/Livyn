import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Users, Sparkles, ClipboardCheck, ClipboardList, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { getLeaderProfile, listMyCircles } from "@/lib/queries/community";
import { isLeader } from "@/lib/community/permissions";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";

export default async function LeaderDashboardPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const [profile, circles] = await Promise.all([
    getLeaderProfile(session.sub),
    listMyCircles(session.sub).catch(() => []),
  ]);

  const verified = profile?.verified && isLeader(session.role);
  const pending = profile && !profile.verified && !profile.rejectReason;
  const rejected = profile && !profile.verified && profile.rejectReason;

  return (
    <div>
      <TopBar title="Pemimpin" back />

      <div className="space-y-5 px-5 pb-10 pt-2">
        {/* Status card */}
        {!profile && (
          <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent p-5">
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <p className="font-display text-[16px] font-extrabold text-heading">Kamu Pendeta atau Pemimpin?</p>
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Dapatkan tools khusus untuk menggembalakan jemaat digital: circle lebih besar (hingga 100 anggota),
              misi mingguan, catatan khotbah, dan siaran ke seluruh circle.
            </p>
            <Link
              href="/app/pemimpin/daftar"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-[13px] font-bold text-primary-foreground active:scale-95 transition-transform"
            >
              Ajukan Verifikasi <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        )}

        {pending && (
          <Card className="border-amber-500/25 bg-amber-500/[0.06] p-5">
            <div className="mb-2 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-600" />
              <p className="font-display text-[15px] font-extrabold text-heading">Aplikasi sedang direview</p>
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Admin sedang meninjau aplikasimu untuk <strong>{profile.churchName}</strong>. Biasanya
              1-3 hari kerja. Kamu akan diberitahu segera setelah keputusan dibuat.
            </p>
          </Card>
        )}

        {rejected && (
          <Card className="border-rose-500/25 bg-rose-500/[0.06] p-5">
            <div className="mb-2 flex items-center gap-2">
              <p className="font-display text-[15px] font-extrabold text-heading">Aplikasi belum disetujui</p>
            </div>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Alasan: <em>{profile.rejectReason}</em>
            </p>
            <Link
              href="/app/pemimpin/daftar"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-primary"
            >
              Kirim ulang aplikasi <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </Card>
        )}

        {verified && profile && (
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-5">
            <div className="mb-2 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-emerald-600" />
              <p className="font-display text-[15px] font-extrabold text-heading">
                Pemimpin Terverifikasi
              </p>
            </div>
            <div className="text-[13px] leading-relaxed text-muted-foreground">
              <p><strong className="text-heading">{profile.position}</strong> di {profile.churchName}</p>
              {profile.city && <p className="mt-0.5">{profile.city}</p>}
            </div>
          </Card>
        )}

        {/* Circles managed */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-[15px] font-extrabold text-heading">Circle yang Kamu Kelola</h2>
            <Link href="/app/circle/buat" className="text-[12px] font-bold text-primary">
              + Baru
            </Link>
          </div>
          {circles.filter((c) => c.ownerId === session.sub).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
              <Users className="mx-auto mb-2 h-7 w-7 text-muted-foreground/40" />
              <p className="text-[13px] text-muted-foreground">Belum ada circle yang kamu buat.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {circles
                .filter((c) => c.ownerId === session.sub)
                .map((c) => (
                  <li key={c.id}>
                    <Link href={`/app/circle/${c.id}`}>
                      <Card className="flex items-center gap-3 p-4 active:scale-[0.98] transition-transform">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-soft text-[20px]">
                          {c.emoji}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-display truncate text-[14px] font-bold text-heading">{c.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {c._count?.members ?? 0}/{c.memberLimit} anggota · kode {c.joinCode}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/40" />
                      </Card>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </section>

        {/* Tips */}
        <Card className="p-5">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <p className="text-[11px] font-bold uppercase tracking-wider">Tips Menggembalakan</p>
          </div>
          <ul className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
            <li>• Buat <strong className="text-heading">misi mingguan</strong> yang selaras dengan khotbah Minggu — memudahkan jemaat melangsungkan Firman di hari kerja.</li>
            <li>• Pakai <strong className="text-heading">catatan khotbah</strong> untuk siaran ringkas hari Minggu sore.</li>
            <li>• <strong className="text-heading">Fokus doa mingguan</strong> menyatukan hati jemaat pada satu topik doa spesifik.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
