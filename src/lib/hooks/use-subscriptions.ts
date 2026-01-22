import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  AnalyticsMonthlyMetric,
  AnalyticsMonthlyMetricInsert,
} from '@/types/supabase';

export function useSubscriptionMetrics() {
  const queryClient = useQueryClient();

  const metricsQuery = useQuery({
    queryKey: ['subscription-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_monthly_metrics')
        .select('*')
        .order('month');

      if (error) throw error;
      return data as AnalyticsMonthlyMetric[];
    },
  });

  const createMetric = useMutation({
    mutationFn: async (payload: AnalyticsMonthlyMetricInsert) => {
      const { data, error } = await supabase
        .from('analytics_monthly_metrics')
        .insert(payload)
        .select()
        .single();

      if (error) throw error;
      return data as AnalyticsMonthlyMetric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
    },
  });

  const updateMetric = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<AnalyticsMonthlyMetricInsert>;
    }) => {
      const { data, error } = await supabase
        .from('analytics_monthly_metrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as AnalyticsMonthlyMetric;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
    },
  });

  const deleteMetric = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('analytics_monthly_metrics')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-metrics'] });
    },
  });

  return {
    ...metricsQuery,
    createMetric,
    updateMetric,
    deleteMetric,
  };
}

export async function fetchMarketingSpendForMonth(month: string) {
  const date = new Date(month);
  const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  const { data, error } = await supabase
    .from('expenses')
    .select('amount')
    .eq('category', 'Marketing')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0]);

  if (error) throw error;

  return (data || []).reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );
}
