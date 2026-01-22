'use client';

import { MetricsEntryTable } from '@/components/subscriptions/metrics-entry-table';
import { GrowthPulse } from '@/components/subscriptions/growth-pulse';
import { useSubscriptionMetrics } from '@/lib/hooks/use-subscriptions';

export function SubscriptionsView() {
  const {
    data: metrics,
    isLoading,
    error,
    createMetric,
    updateMetric,
    deleteMetric,
  } = useSubscriptionMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Subscriptions</h1>
        <p className="text-stone-500">
          Track subscription health before automation
        </p>
      </div>

      <MetricsEntryTable
        metrics={metrics}
        isLoading={isLoading}
        error={error}
        createMetric={createMetric}
        updateMetric={updateMetric}
        deleteMetric={deleteMetric}
      />

      <GrowthPulse metrics={metrics} isLoading={isLoading} error={error} />
    </div>
  );
}
