import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { listCategories } from "@/lib/queries/devotions";
import { DevotionForm } from "@/components/contributor/devotion-form";

export default async function NewDevotionPage() {
  const session = await getCurrentUser();
  if (!session || !hasRole(session.role, "contributor")) redirect("/app");

  const categories = await listCategories();

  return (
    <div>
      <h1 className="font-display mb-5 text-xl font-bold">Renungan Baru</h1>
      <DevotionForm categories={categories} />
    </div>
  );
}
