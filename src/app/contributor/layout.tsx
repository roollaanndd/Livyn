import { DashboardShell } from "@/components/nav/dashboard-shell";

export default function ContributorLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Kontributor" variant="contributor">
      {children}
    </DashboardShell>
  );
}
