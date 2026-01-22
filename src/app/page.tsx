import { KPICards } from '@/components/dashboard/kpi-cards';
import { RecentActivity } from '@/components/dashboard/recent-activity';

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
        <p className="text-stone-500">Welcome back to Misu ERP</p>
      </div>

      {/* KPI Cards */}
      <KPICards />

      {/* Recent Activity */}
      <section>
        <h2 className="mb-4 text-lg font-medium text-stone-800">
          Recent Activity
        </h2>
        <RecentActivity />
      </section>
    </div>
  );
}
