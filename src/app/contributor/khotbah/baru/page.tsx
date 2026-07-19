import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { listCategories } from "@/lib/queries/devotions";
import { SermonForm } from "@/components/contributor/sermon-form";

export default async function NewSermonPage() {
  const session = await getCurrentUser();
  if (!session || !hasRole(session.role, "contributor")) redirect("/app");

  const categories = await listCategories();

  return (
    <div>
      <h1 className="font-display mb-5 text-xl font-bold">Khotbah Baru</h1>
      <SermonForm categories={categories} />
    </div>
  );
}
