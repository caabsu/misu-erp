'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { CalendarClock } from 'lucide-react';

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const formatMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

export function MonthlyComparison() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'monthly-comparison'],
    queryFn: async () => {
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const lastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 0);

      const { data: expenses, error: fetchError } = await supabase
        .from('expenses')
        .select('date, amount')
        .gte('date', lastYearStart.toISOString().split('T')[0])
        .lte('date', thisMonthEnd.toISOString().split('T')[0]);

      if (fetchError) throw fetchError;

      const totals = {
        lastYear: 0,
        lastMonth: 0,
        thisMonth: 0,
      };

      for (const expense of expenses || []) {
        const expenseDate = new Date(expense.date);
        if (expenseDate >= lastYearStart && expenseDate <= lastYearEnd) {
          totals.lastYear += expense.amount;
        }
        if (expenseDate >= lastMonthStart && expenseDate <= lastMonthEnd) {
          totals.lastMonth += expense.amount;
        }
        if (expenseDate >= thisMonthStart && expenseDate <= thisMonthEnd) {
          totals.thisMonth += expense.amount;
        }
      }

      return [
        {
          label: `${formatMonthLabel(lastYearStart)} LY`,
          total: totals.lastYear,
        },
        {
          label: formatMonthLabel(lastMonthStart),
          total: totals.lastMonth,
        },
        {
          label: formatMonthLabel(thisMonthStart),
          total: totals.thisMonth,
        },
      ];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-stone-700" />
            Monthly Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="py-6 text-center text-rose-700">
          Failed to load monthly comparison
        </CardContent>
      </Card>
    );
  }

  if (data.every((point) => point.total === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="h-4 w-4 text-stone-700" />
            Monthly Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-stone-400">
            No burn data to compare
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-stone-700" />
          Monthly Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 10, right: 10 }}>
              <defs>
                <linearGradient id="burnFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                dataKey="label"
                tick={{ fill: '#78716c', fontSize: 12 }}
                axisLine={{ stroke: '#d6d3d1' }}
              />
              <YAxis
                tick={{ fill: '#78716c', fontSize: 12 }}
                axisLine={{ stroke: '#d6d3d1' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), 'Total Burn']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#0f172a"
                fill="url(#burnFill)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
