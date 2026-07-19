import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/rbac";
import { sermonSchema } from "@/lib/validation/content";
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

  const parsed = sermonSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const { submit, categoryId, thumbnailUrl, transcript, church, ...data } = parsed.data;

  const sermon = await prisma.sermon.create({
    data: {
      ...data,
      church: church || null,
      thumbnailUrl: thumbnailUrl || null,
      transcript: transcript || null,
      categoryId: categoryId || null,
      slug: slugify(data.title),
      authorId: session.sub,
      status: submit ? "pending" : "draft",
    },
  });

  await logAudit({ userId: session.sub, action: submit ? "content.sermon_submitted" : "content.sermon_draft_saved", targetType: "sermon", targetId: sermon.id });

  return NextResponse.json({ sermon });
}
