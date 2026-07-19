import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { getOwnedDevotion } from "@/lib/queries/contributor";
import { listCategories } from "@/lib/queries/devotions";
import { DevotionForm } from "@/components/contributor/devotion-form";
import { Badge } from "@/components/ui/badge";

export default async function EditDevotionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentUser();
  if (!session || !hasRole(session.role, "contributor")) redirect("/app");

  const { id } = await params;
  const [devotion, categories] = await Promise.all([getOwnedDevotion(session.sub, id), listCategories()]);
  if (!devotion) notFound();

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <h1 className="font-display text-xl font-bold">Ubah Renungan</h1>
        {devotion.status === "rejected" && <Badge variant="danger">Ditolak</Badge>}
      </div>
      {devotion.status === "rejected" && devotion.rejectReason && (
        <p className="mb-4 rounded-md bg-red-500/10 p-3 text-sm text-red-600">Alasan penolakan: {devotion.rejectReason}</p>
      )}
      <DevotionForm
        devotionId={devotion.id}
        categories={categories}
        initial={{
          title: devotion.title,
          excerpt: devotion.excerpt,
          body: devotion.body,
          bibleRefs: devotion.bibleRefs,
          readingTimeMin: devotion.readingTimeMin,
          categoryId: devotion.categoryId,
        }}
      />
    </div>
  );
}
