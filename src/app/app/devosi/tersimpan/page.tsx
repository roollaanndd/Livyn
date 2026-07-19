import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { listUserBookmarkedDevotions } from "@/lib/queries/devotions";
import { TopBar } from "@/components/nav/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function SavedDevotionsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/masuk");

  const devotions = await listUserBookmarkedDevotions(session.sub);

  return (
    <div>
      <TopBar title="Renungan Tersimpan" back />
      <div className="space-y-3 px-4 pb-6 pt-3">
        {devotions.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Belum ada renungan yang kamu simpan. Ketuk ikon bookmark pada renungan untuk menyimpannya di sini.
          </p>
        )}
        {devotions.map((d) => (
          <Link key={d.id} href={`/app/devosi/${d.slug}`}>
            <Card className="p-4 active:scale-[0.99] transition-transform">
              <div className="mb-1.5 flex items-center gap-2">
                {d.category && <Badge variant="muted">{d.category.name}</Badge>}
              </div>
              <h3 className="font-display font-bold leading-snug">{d.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{d.excerpt}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
