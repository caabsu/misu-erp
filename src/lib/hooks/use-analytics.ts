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

type VendorJoin = { name: string } | { name: string }[] | null;

interface ExpenseAnalyticsRow {
  amount: number;
  category: ExpenseCategory;
  vendors: VendorJoin;
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

      // Supabase's select-string type inference can treat joins as arrays in TS
      // even when the relationship is many-to-one. Normalize here for safety.
      const rows = (data || []) as unknown as ExpenseAnalyticsRow[];

      const totalSpend = rows.reduce((sum, expense) => sum + (expense.amount || 0), 0);

      const categoryMap = new Map<ExpenseCategory, number>();
      const vendorMap = new Map<string, number>();

      for (const expense of rows) {
        const category = expense.category as ExpenseCategory;
        const vendors = expense.vendors;
        const vendorName = !vendors
          ? 'Unassigned'
          : Array.isArray(vendors)
            ? vendors[0]?.name || 'Unassigned'
            : vendors.name || 'Unassigned';

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
