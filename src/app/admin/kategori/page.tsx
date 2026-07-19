import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canModerate, isAdmin } from "@/lib/auth/rbac";
import { listAllCategories } from "@/lib/queries/admin";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function CategoriesPage() {
  const session = await getCurrentUser();
  if (!session || !canModerate(session.role)) redirect("/app");

  const categories = await listAllCategories();

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold">Kategori</h1>
      <CategoryManager
        initialCategories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, devotionCount: c._count.devotions, sermonCount: c._count.sermons }))}
        canEdit={isAdmin(session.role)}
      />
    </div>
  );
}
