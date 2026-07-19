import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { devotionSchema } from "@/lib/validation/content";
import { logAudit } from "@/lib/audit";

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") + "-" + Math.random().toString(36).slice(2, 7)
  );
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || !hasRole(session.role, "contributor")) {
    return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });
  }

  const parsed = devotionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const { submit, categoryId, ...data } = parsed.data;

  const devotion = await prisma.devotion.create({
    data: {
      ...data,
      categoryId: categoryId || null,
      slug: slugify(data.title),
      authorId: session.sub,
      status: submit ? "pending" : "draft",
    },
  });

  await logAudit({ userId: session.sub, action: submit ? "content.devotion_submitted" : "content.devotion_draft_saved", targetType: "devotion", targetId: devotion.id });

  return NextResponse.json({ devotion });
}
