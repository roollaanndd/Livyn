import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { listRecentAuditLogs } from "@/lib/queries/admin";
import { Card } from "@/components/ui/card";

export default async function AuditLogPage() {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) redirect("/app");

  const logs = await listRecentAuditLogs();

  return (
    <div>
      <h1 className="font-display mb-6 text-2xl font-bold">Log Audit</h1>
      <div className="space-y-1.5">
        {logs.map((log) => (
          <Card key={log.id} className="flex items-center justify-between gap-3 p-3.5">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{log.action}</p>
              <p className="truncate text-xs text-muted-foreground">
                {log.user?.name ?? "Sistem"} {log.targetType && `· ${log.targetType}:${log.targetId?.slice(0, 8)}`} {log.ipAddress && `· ${log.ipAddress}`}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {log.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
