import { DashboardShell } from "@/components/nav/dashboard-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell title="Admin" variant="admin">
      {children}
    </DashboardShell>
  );
}
