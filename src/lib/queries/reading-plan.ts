import "server-only";
import { prisma } from "@/lib/prisma";

export type Enrollment = {
  id: string;
  userId: string;
  planId: string;
  startedAt: string;
  completedDays: string;
  completedAt: string | null;
};

export async function getActiveReadingPlans() {
  return prisma.readingPlan.findMany({
    where: { active: true },
    orderBy: { totalDays: "asc" },
  });
}

export async function getReadingPlanBySlug(slug: string) {
  return prisma.readingPlan.findUnique({ where: { slug } });
}

export async function getUserEnrollments(userId: string): Promise<Enrollment[]> {
  return prisma.readingPlanEnrollment.findMany({
    where: { userId },
    include: { plan: true },
    orderBy: { startedAt: "desc" },
  }) as Promise<Enrollment[]>;
}

export async function getEnrollment(userId: string, planId: string) {
  return prisma.readingPlanEnrollment.findUnique({
    where: { userId_planId: { userId, planId } },
  });
}
