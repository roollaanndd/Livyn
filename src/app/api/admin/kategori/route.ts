import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";

const schema = z.object({ name: z.string().trim().min(2).max(40) });

function slugify(name: string) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function POST(req: NextRequest) {
  const session = await getCurrentUser();
  if (!session || !isAdmin(session.role)) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Nama kategori tidak valid" }, { status: 400 });

  const slug = slugify(parsed.data.name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return NextResponse.json({ error: "Kategori sudah ada" }, { status: 409 });

  const category = await prisma.category.create({ data: { name: parsed.data.name, slug } });
  await logAudit({ userId: session.sub, action: "admin.category_created", targetType: "category", targetId: category.id });

  revalidateTag("categories", "max");

  return NextResponse.json({ category });
}
