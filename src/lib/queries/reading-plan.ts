import "server-only";
import { prisma } from "@/lib/prisma";

export async function getActiveReadingPlans() {
  return prisma.readingPlan.findMany({
    where: { active: true },
    orderBy: { totalDays: "asc" },
  });
}

export async function getReadingPlanBySlug(slug: string) {
  return prisma.readingPlan.findUnique({ where: { slug } });
}

export async function getUserEnrollments(userId: string) {
  return prisma.readingPlanEnrollment.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { startedAt: "desc" },
  });
}

export async function getEnrollment(userId: string, planId: string) {
  return prisma.readingPlanEnrollment.findUnique({
    where: { userId_planId: { userId, planId } },
  });
}
