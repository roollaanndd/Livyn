import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { canModerate, isAdmin } from "@/lib/auth/rbac";
import { listAllUsers } from "@/lib/queries/admin";
import { UserTable } from "@/components/admin/user-table";

export default async function UsersPage() {
  const session = await getCurrentUser();
  if (!session || !canModerate(session.role)) redirect("/app");

  const users = await listAllUsers();

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold">Manajemen Pengguna</h1>
      <UserTable
        users={users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, status: u.status }))}
        currentUserId={session.sub}
        canEditRoles={isAdmin(session.role)}
      />
    </div>
  );
}
