import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Component } from '@/types/supabase';

// Get total expenses for current month
export function useCurrentMonthBurn() {
  return useQuery({
    queryKey: ['dashboard', 'burn'],
    queryFn: async () => {
      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('expenses')
        .select('amount')
        .gte('date', firstOfMonth.toISOString().split('T')[0])
        .lte('date', lastOfMonth.toISOString().split('T')[0]);

      if (error) throw error;

      const total = (data as { amount: number }[]).reduce((sum, exp) => sum + exp.amount, 0);
      return total;
    },
  });
}

// Get count of low stock components
export function useLowStockCount() {
  return useQuery({
    queryKey: ['dashboard', 'lowStock'],
    queryFn: async () => {
      const { data, error } = await supabase.from('components').select('*');

      if (error) throw error;

      const lowStockCount = (data as Component[]).filter(
        (c) => c.current_stock < c.safety_stock_threshold
      ).length;

      return lowStockCount;
    },
  });
}

interface ExpenseActivity {
  id: string;
  created_at: string;
  amount: number;
  description: string | null;
  vendors: { name: string } | null;
}

interface ProductActivity {
  id: string;
  name: string;
  current_stock: number;
}

// Get recent activity (expenses + inventory changes)
export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'activity'],
    queryFn: async () => {
      // Get recent expenses
      const { data: expenses, error: expenseError } = await supabase
        .from('expenses')
        .select(
          `
          id,
          created_at,
          amount,
          description,
          vendors (name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(5);

      if (expenseError) throw expenseError;

      // Get products with stock (as proxy for assembly activity)
      const { data: products, error: productError } = await supabase
        .from('products')
        .select('id, name, current_stock')
        .gt('current_stock', 0)
        .order('name')
        .limit(5);

      if (productError) throw productError;

      const expenseActivities = (expenses as unknown as ExpenseActivity[]).map((e) => ({
        id: e.id,
        type: 'expense' as const,
        title: e.vendors?.name || 'Expense',
        description: e.description || 'No description',
        amount: e.amount,
        timestamp: e.created_at,
      }));

      const productActivities = (products as unknown as ProductActivity[]).map((p) => ({
        id: p.id,
        type: 'inventory' as const,
        title: p.name,
        description: `${p.current_stock} units in stock`,
        timestamp: null,
      }));

      return {
        expenses: expenseActivities,
        products: productActivities,
      };
    },
  });
}
