'use client';

import { Receipt, Box } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecentActivity } from '@/lib/hooks/use-dashboard';

export function RecentActivity() {
  const { data, isLoading, error } = useRecentActivity();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex animate-pulse items-center gap-3"
              >
                <div className="h-8 w-8 rounded-lg bg-stone-200" />
                <div className="flex-1">
                  <div className="h-4 w-24 rounded bg-stone-200" />
                  <div className="mt-1 h-3 w-32 rounded bg-stone-100" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="py-6 text-center text-rose-700">
          Failed to load activity
        </CardContent>
      </Card>
    );
  }

  const hasActivity =
    (data?.expenses?.length || 0) > 0 || (data?.products?.length || 0) > 0;

  if (!hasActivity) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-stone-400">No recent activity</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Receipt className="h-4 w-4 text-rose-500" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.expenses && data.expenses.length > 0 ? (
            <ul className="space-y-3">
              {data.expenses.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      {item.title}
                    </p>
                    <p className="text-xs text-stone-500">{item.description}</p>
                  </div>
                  <span className="font-mono text-sm text-rose-600">
                    -${item.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm text-stone-400">
              No recent expenses
            </p>
          )}
        </CardContent>
      </Card>

      {/* Inventory Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Box className="h-4 w-4 text-amber-500" />
            Product Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.products && data.products.length > 0 ? (
            <ul className="space-y-3">
              {data.products.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2"
                >
                  <p className="text-sm font-medium text-stone-900">
                    {item.title}
                  </p>
                  <span className="text-sm text-stone-600">
                    {item.description}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-sm text-stone-400">
              No products in stock
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
