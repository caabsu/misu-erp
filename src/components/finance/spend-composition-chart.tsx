'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsData } from '@/lib/hooks/use-analytics';
import { PieChart as PieIcon } from 'lucide-react';
import type { ExpenseCategory } from '@/types/supabase';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  OpEx: '#2563eb',
  COGS: '#d97706',
  Marketing: '#7c3aed',
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function SpendCompositionChart({
  startDate,
  endDate,
  rangeLabel,
}: {
  startDate: string;
  endDate: string;
  rangeLabel: string;
}) {
  const { data, isLoading, error } = useAnalyticsData({ startDate, endDate });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieIcon className="h-4 w-4 text-stone-700" />
            Spend Composition
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
          Failed to load spend composition
        </CardContent>
      </Card>
    );
  }

  if (data.totalSpend === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <PieIcon className="h-4 w-4 text-stone-700" />
            Spend Composition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-stone-400">
            No expenses in this range
          </div>
        </CardContent>
      </Card>
    );
  }

  const marketingSlice = data.categoryTotals.find(
    (item) => item.category === 'Marketing'
  );
  const marketingPercent = marketingSlice ? Math.round(marketingSlice.percent * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PieIcon className="h-4 w-4 text-stone-700" />
          Spend Composition
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.categoryTotals}
                dataKey="total"
                nameKey="category"
                cx="40%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
              >
                {data.categoryTotals.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={CATEGORY_COLORS[entry.category]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [formatCurrency(value as number), name]}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                iconType="circle"
                formatter={(value) => (
                  <span className="text-sm text-stone-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
          You spent {marketingPercent}% on Marketing {rangeLabel}.
        </div>
      </CardContent>
    </Card>
  );
}
