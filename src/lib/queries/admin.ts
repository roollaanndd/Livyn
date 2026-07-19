import "server-only";
import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  const [totalUsers, totalContributors, pendingDevotions, pendingSermons, publishedDevotions, publishedSermons, openReports] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ["contributor", "moderator", "admin", "super_admin"] } } }),
      prisma.devotion.count({ where: { status: "pending" } }),
      prisma.sermon.count({ where: { status: "pending" } }),
      prisma.devotion.count({ where: { status: "published" } }),
      prisma.sermon.count({ where: { status: "published" } }),
      prisma.report.count({ where: { status: "open" } }),
    ]);
  return { totalUsers, totalContributors, pendingDevotions, pendingSermons, publishedDevotions, publishedSermons, openReports };
}

export async function listPendingDevotions() {
  return prisma.devotion.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" }, include: { author: true, category: true } });
}

export async function listPendingSermons() {
  return prisma.sermon.findMany({ where: { status: "pending" }, orderBy: { createdAt: "asc" }, include: { author: true, category: true } });
}

export async function listAllUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
}

export async function listAllCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { devotions: true, sermons: true } } },
  });
}

export async function listRecentAuditLogs() {
  return prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 60, include: { user: true } });
}
