import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canModerate } from "@/lib/auth/rbac";
import { listPendingDevotions, listPendingSermons } from "@/lib/queries/admin";
import { ModerationQueue } from "@/components/admin/moderation-queue";

export default async function ModerationPage() {
  const session = await getCurrentUser();
  if (!session || !canModerate(session.role)) redirect("/app");

  const [devotions, sermons] = await Promise.all([listPendingDevotions(), listPendingSermons()]);

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold">Moderasi Konten</h1>
      <ModerationQueue
        devotions={devotions.map((d) => ({ id: d.id, title: d.title, excerpt: d.excerpt, authorName: d.author.name, categoryName: d.category?.name }))}
        sermons={sermons.map((s) => ({ id: s.id, title: s.title, description: s.description, authorName: s.author.name, categoryName: s.category?.name }))}
      />
    </div>
  );
}
