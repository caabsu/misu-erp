import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  Expense,
  ExpenseInsert,
  ExpenseWithVendor,
  Vendor,
  VendorInsert,
} from '@/types/supabase';

// Fetch all expenses with vendor info
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select(
          `
          *,
          vendors (*)
        `
        )
        .order('date', { ascending: false });
      if (error) throw error;
      return data as ExpenseWithVendor[];
    },
  });
}

// Fetch all vendors
export function useVendors() {
  return useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Vendor[];
    },
  });
}

// Create a new vendor
export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendor: VendorInsert) => {
      const { data, error } = await supabase
        .from('vendors')
        .insert(vendor)
        .select()
        .single();
      if (error) throw error;
      return data as Vendor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
  });
}

// Create a new expense
export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expense: ExpenseInsert) => {
      const { data, error } = await supabase
        .from('expenses')
        .insert(expense)
        .select()
        .single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// Update an expense
export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ExpenseInsert>;
    }) => {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Expense;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// Delete an expense
export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
  });
}

// Get monthly expense totals for the chart
export function useMonthlyExpenses() {
  return useQuery({
    queryKey: ['expenses', 'monthly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('date, amount')
        .order('date');
      if (error) throw error;

      // Group by month
      const monthlyTotals = new Map<string, number>();
      for (const expense of data) {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyTotals.set(
          monthKey,
          (monthlyTotals.get(monthKey) || 0) + expense.amount
        );
      }

      // Convert to array and get last 6 months
      const sortedMonths = Array.from(monthlyTotals.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6);

      return sortedMonths.map(([month, total]) => ({
        month: formatMonth(month),
        total,
      }));
    },
  });
}

function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}
