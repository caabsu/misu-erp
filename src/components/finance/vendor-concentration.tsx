'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAnalyticsData } from '@/lib/hooks/use-analytics';
import { Building } from 'lucide-react';

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export function VendorConcentration({
  startDate,
  endDate,
}: {
  startDate: string;
  endDate: string;
}) {
  const { data, isLoading, error } = useAnalyticsData({ startDate, endDate });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-4 w-4 text-stone-700" />
            Vendor Concentration
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
          Failed to load vendor concentration
        </CardContent>
      </Card>
    );
  }

  const topVendors = data.vendorTotals.slice(0, 5);
  const topVendor = topVendors[0];

  if (topVendors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building className="h-4 w-4 text-stone-700" />
            Vendor Concentration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-64 items-center justify-center text-stone-400">
            No vendor spend in this range
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Building className="h-4 w-4 text-stone-700" />
          Vendor Concentration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topVendors} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis
                type="number"
                tick={{ fill: '#78716c', fontSize: 12 }}
                axisLine={{ stroke: '#d6d3d1' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <YAxis
                type="category"
                dataKey="vendor"
                tick={{ fill: '#78716c', fontSize: 12 }}
                axisLine={{ stroke: '#d6d3d1' }}
                width={110}
              />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number), 'Spend']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e7e5e4',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
              />
              <Bar dataKey="total" fill="#0f172a" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        {topVendor && (
          <div className="mt-4 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">
            {topVendor.vendor} is your #1 cost center ({formatCurrency(topVendor.total)}).
          </div>
        )}
      </CardContent>
    </Card>
  );
}
