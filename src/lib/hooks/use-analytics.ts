import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ExpenseCategory } from '@/types/supabase';

const CATEGORY_ORDER: ExpenseCategory[] = ['OpEx', 'COGS', 'Marketing'];

export interface CategoryTotal {
  category: ExpenseCategory;
  total: number;
  percent: number;
}

export interface VendorTotal {
  vendor: string;
  total: number;
}

interface AnalyticsData {
  totalSpend: number;
  categoryTotals: CategoryTotal[];
  vendorTotals: VendorTotal[];
}

export function useAnalyticsData({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  return useQuery({
    queryKey: ['analytics', 'expenses', startDate, endDate],
    queryFn: async (): Promise<AnalyticsData> => {
      if (!startDate || !endDate) {
        return { totalSpend: 0, categoryTotals: [], vendorTotals: [] };
      }

      const { data, error } = await supabase
        .from('expenses')
        .select('amount, category, vendor_id, vendors (name)')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;

      const totalSpend = (data || []).reduce(
        (sum, expense) => sum + (expense.amount || 0),
        0
      );

      const categoryMap = new Map<ExpenseCategory, number>();
      const vendorMap = new Map<string, number>();

      for (const expense of data || []) {
        const category = expense.category as ExpenseCategory;
        const vendorName = expense.vendors?.name || 'Unassigned';
        categoryMap.set(category, (categoryMap.get(category) || 0) + expense.amount);
        vendorMap.set(vendorName, (vendorMap.get(vendorName) || 0) + expense.amount);
      }

      const categoryTotals = CATEGORY_ORDER.map((category) => {
        const total = categoryMap.get(category) || 0;
        return {
          category,
          total,
          percent: totalSpend > 0 ? total / totalSpend : 0,
        };
      });

      const vendorTotals = Array.from(vendorMap.entries())
        .map(([vendor, total]) => ({ vendor, total }))
        .sort((a, b) => b.total - a.total);

      return {
        totalSpend,
        categoryTotals,
        vendorTotals,
      };
    },
  });
}
