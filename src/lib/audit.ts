import { db } from "@/lib/supabase-rest";

export async function logAudit(params: {
  userId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}) {
  await db.audit.create({
    userId: params.userId ?? null,
    action: params.action,
    targetType: params.targetType,
    targetId: params.targetId,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    ipAddress: params.ipAddress,
  });
}
