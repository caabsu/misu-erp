import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { RecurringRule, RecurringRuleInsert, RecurringRuleWithVendor } from '@/types/supabase';

// Fetch all recurring rules
export function useRecurringRules() {
  return useQuery({
    queryKey: ['recurring-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_rules')
        .select(`
          *,
          vendors (*)
        `)
        .order('next_due_date', { ascending: true });
      if (error) throw error;
      return data as unknown as RecurringRuleWithVendor[];
    },
  });
}

// Create a new recurring rule
export function useCreateRecurringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (rule: RecurringRuleInsert) => {
      const { data, error } = await supabase
        .from('recurring_rules')
        .insert(rule)
        .select()
        .single();
      if (error) throw error;
      return data as RecurringRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules'] });
    },
  });
}

// Update a recurring rule
export function useUpdateRecurringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<RecurringRuleInsert>;
    }) => {
      const { data, error } = await supabase
        .from('recurring_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as RecurringRule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules'] });
    },
  });
}

// Toggle active status
export function useToggleRecurringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('recurring_rules')
        .update({ active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules'] });
    },
  });
}

// Delete a recurring rule
export function useDeleteRecurringRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { error } = await supabase
        .from('recurring_rules')
        .delete()
        .eq('id', ruleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules'] });
    },
  });
}

// Calculate monthly/annual totals from recurring rules
export function calculateRecurringTotals(rules: RecurringRuleWithVendor[]) {
  let monthlyTotal = 0;
  let annualTotal = 0;

  for (const rule of rules) {
    if (!rule.active) continue;

    if (rule.frequency === 'monthly') {
      monthlyTotal += rule.amount;
      annualTotal += rule.amount * 12;
    } else if (rule.frequency === 'yearly') {
      monthlyTotal += rule.amount / 12;
      annualTotal += rule.amount;
    }
  }

  return { monthlyTotal, annualTotal };
}
