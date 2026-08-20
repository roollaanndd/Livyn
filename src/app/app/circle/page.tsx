import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LivynPlus,
  LivynKey,
  LivynPeople,
  LivynPrayer,
  LivynTrophy,
  LivynCrown,
} from "@/components/icons/livyn-icons";
import { getCurrentUser } from "@/lib/auth/session";
import { listMyCircles } from "@/lib/queries/community";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";

export default async function CircleListPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const circles = await listMyCircles(session.sub).catch(() => []);

  return (
    <div>
      <TopBar title="Circle" />

      <div className="space-y-5 px-5 pb-8">
        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/app/circle/buat">
            <Card className="flex items-center gap-3 p-4 active:scale-[0.98] transition-transform">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LivynPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-heading">Buat Circle</p>
                <p className="text-[11px] text-muted-foreground">Mulai lingkaran baru</p>
              </div>
            </Card>
          </Link>
          <Link href="/app/circle/gabung">
            <Card className="flex items-center gap-3 p-4 active:scale-[0.98] transition-transform">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                <LivynKey className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-heading">Gabung Circle</p>
                <p className="text-[11px] text-muted-foreground">Pakai kode undangan</p>
              </div>
            </Card>
          </Link>
        </div>

        {/* Circle list */}
        <section>
          <h2 className="mb-3 font-display text-[15px] font-extrabold text-heading">Circle-mu</h2>
          {circles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
              <LivynPeople className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-[13px] text-muted-foreground">
                Belum tergabung di circle mana pun.
              </p>
              <p className="mt-1 text-[12px] text-muted-foreground/70">
                Buat sendiri atau minta kode dari teman/gembala untuk bergabung.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {circles.map((c) => (
                <li key={c.id}>
                  <Link href={`/app/circle/${c.id}`}>
                    <Card className="active:scale-[0.99] transition-transform">
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-[22px]">
                          {c.emoji || "🌿"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-display text-[15px] font-extrabold text-heading">{c.name}</p>
                            {c.type === "pastoral" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                                <LivynCrown className="h-3 w-3" /> Pastoral
                              </span>
                            )}
                          </div>
                          {c.description && (
                            <p className="mt-0.5 line-clamp-1 text-[12px] text-muted-foreground">{c.description}</p>
                          )}
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <LivynPeople className="h-3 w-3" /> {c._count?.members ?? 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <LivynPrayer className="h-3 w-3" /> {c._count?.prayers ?? 0}
                            </span>
                            {(c._count?.missions ?? 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <LivynTrophy className="h-3 w-3" /> {c._count?.missions ?? 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
