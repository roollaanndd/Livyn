import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BookmarkCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listFavorites } from "@/lib/queries/favorites";
import { getT, getLocale } from "@/lib/i18n/server";
import { EmptyState } from "@/components/ui/empty-state";
import { FavoriteList } from "@/components/verse/favorite-list";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("favorites.title")} — Livyn` };
}

export default async function FavoritesPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const [favorites, t, locale] = await Promise.all([listFavorites(session.sub), getT(), getLocale()]);

  return (
    <div className="px-5 pb-10 safe-top animate-fade-in">
      <div className="flex items-center gap-3 py-3">
        <Link
          href="/app/profil"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-muted text-muted-foreground"
          aria-label={t("common.back")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="font-display text-[20px] font-extrabold leading-tight text-heading">
            {t("favorites.title")}
          </h1>
          <p className="text-[12px] text-muted-foreground">
            {favorites.length > 0 ? t("favorites.count", { count: favorites.length }) : t("favorites.subtitle")}
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<BookmarkCheck className="h-7 w-7" />}
          title={t("favorites.empty")}
          description={t("favorites.emptyHint")}
        />
      ) : (
        <FavoriteList favorites={favorites} locale={locale} />
      )}
    </div>
  );
}
