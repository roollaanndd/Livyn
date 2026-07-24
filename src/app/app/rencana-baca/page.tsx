import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { getActiveReadingPlans, getUserEnrollments } from "@/lib/queries/reading-plan";
import { TopBar } from "@/components/nav/top-bar";
import { PlanCard } from "@/components/reading-plan/plan-card";

export default async function ReadingPlansPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/");

  const [plans, enrollments] = await Promise.all([
    getActiveReadingPlans(),
    getUserEnrollments(session.sub),
  ]);

  const enrollmentMap = new Map(
    enrollments.map((e) => [e.planId, e]),
  );

  const myPlans = plans.filter((p) => enrollmentMap.has(p.id));
  const availablePlans = plans.filter((p) => !enrollmentMap.has(p.id));

  return (
    <div>
      <TopBar title="Rencana Bacaan" />
      <div className="space-y-6 px-5 pb-8 pt-4">
        {myPlans.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rencana Aktif
            </h2>
            <div className="space-y-3">
              {myPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  enrollment={enrollmentMap.get(plan.id) ?? null}
                />
              ))}
            </div>
          </div>
        )}

        {availablePlans.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Temukan Rencana
            </h2>
            <div className="space-y-3">
              {availablePlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} enrollment={null} />
              ))}
            </div>
          </div>
        )}

        {plans.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada rencana bacaan tersedia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
