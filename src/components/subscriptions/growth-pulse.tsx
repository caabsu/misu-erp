'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { AnalyticsMonthlyMetric } from '@/types/supabase';

const LTV_MULTIPLIER = 6;

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const formatMonthLabel = (month: string) =>
  new Date(month).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

const getRatioColor = (ratio: number) => {
  if (ratio >= 3) return '#16a34a';
  if (ratio < 1) return '#e11d48';
  return '#f59e0b';
};

interface GrowthPulseProps {
  metrics: AnalyticsMonthlyMetric[] | undefined;
  isLoading: boolean;
  error?: unknown;
}

export function GrowthPulse({ metrics, isLoading, error }: GrowthPulseProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-stone-700" />
            Growth Pulse
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

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="py-6 text-center text-rose-700">
          Failed to load growth metrics
        </CardContent>
      </Card>
    );
  }

  const chartData = (metrics || [])
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((metric) => {
      const arpu =
        metric.active_subscribers > 0
          ? metric.total_revenue / metric.active_subscribers
          : 0;
      const cac =
        metric.new_subscribers > 0
          ? metric.marketing_spend / metric.new_subscribers
          : 0;
      const ltv = arpu * LTV_MULTIPLIER;
      const ratio = cac > 0 ? ltv / cac : 0;

      return {
        label: formatMonthLabel(metric.month),
        active: metric.active_subscribers,
        ratio,
        ltv,
        cac,
      };
    });

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-stone-700" />
            Growth Pulse
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-stone-400">
            Add metrics to see growth trends
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-stone-700" />
          Growth Pulse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium text-stone-600">
            Active Subscribers
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#78716c', fontSize: 12 }}
                  axisLine={{ stroke: '#d6d3d1' }}
                />
                <YAxis
                  tick={{ fill: '#78716c', fontSize: 12 }}
                  axisLine={{ stroke: '#d6d3d1' }}
                />
                <Tooltip
                  formatter={(value) => [value, 'Active Subscribers']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="active"
                  stroke="#0f172a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-stone-600">
            LTV:CAC Ratio
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#78716c', fontSize: 12 }}
                  axisLine={{ stroke: '#d6d3d1' }}
                />
                <YAxis
                  tick={{ fill: '#78716c', fontSize: 12 }}
                  axisLine={{ stroke: '#d6d3d1' }}
                />
                <Tooltip
                  formatter={(value, name, item) => {
                    const payload = item.payload as {
                      ratio: number;
                      ltv: number;
                      cac: number;
                    };
                    return [
                      `${payload.ratio.toFixed(2)}x (LTV ${formatCurrency(payload.ltv)} / CAC ${formatCurrency(payload.cac)})`,
                      'LTV:CAC',
                    ];
                  }}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e7e5e4',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="ratio" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry) => (
                    <Cell key={entry.label} fill={getRatioColor(entry.ratio)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-stone-500">
            <span>Green zone: ratio &gt; 3.0</span>
            <span>Red zone: ratio &lt; 1.0</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
