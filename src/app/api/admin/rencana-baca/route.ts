import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { readingPlanSchema } from "@/lib/validation/reading-plan";
import { logAudit } from "@/lib/audit";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function GET() {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const plans = await prisma.readingPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { enrollments: true } } },
  });
  return NextResponse.json({ plans });
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const parsed = readingPlanSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Data tidak valid" }, { status: 400 });

  const data = parsed.data;
  let slug = slugify(data.title);

  const existing = await prisma.readingPlan.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const plan = await prisma.readingPlan.create({
    data: {
      slug,
      title: data.title,
      description: data.description,
      coverEmoji: data.coverEmoji,
      totalDays: data.totalDays,
      category: data.category,
      difficulty: data.difficulty,
      schedule: JSON.stringify(data.schedule),
      active: data.active,
    },
  });

  await logAudit({ userId: session.sub, action: "admin.reading_plan_created", targetType: "ReadingPlan", targetId: plan.id });

  return NextResponse.json({ plan });
}
