'use client';

import { TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useCurrentMonthBurn,
  useLowStockCount,
} from '@/lib/hooks/use-dashboard';
import { cn } from '@/lib/utils';

export function KPICards() {
  const { data: burn, isLoading: burnLoading } = useCurrentMonthBurn();
  const { data: lowStock, isLoading: stockLoading } = useLowStockCount();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Cash Burn */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-stone-600">
            Cash Burn (This Month)
          </CardTitle>
          <div className="rounded-lg bg-rose-50 p-2">
            <TrendingDown className="h-4 w-4 text-rose-600" />
          </div>
        </CardHeader>
        <CardContent>
          {burnLoading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-stone-200" />
          ) : (
            <p className="text-2xl font-semibold text-rose-600">
              ${(burn || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          )}
          <p className="mt-1 text-xs text-stone-500">Total expenses this month</p>
        </CardContent>
      </Card>

      {/* Low Stock Alert */}
      <Card
        className={cn(
          lowStock && lowStock > 0 && 'border-amber-200 bg-amber-50/30'
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-stone-600">
            Stock Alerts
          </CardTitle>
          <div
            className={cn(
              'rounded-lg p-2',
              lowStock && lowStock > 0 ? 'bg-amber-100' : 'bg-emerald-50'
            )}
          >
            <AlertTriangle
              className={cn(
                'h-4 w-4',
                lowStock && lowStock > 0 ? 'text-amber-600' : 'text-emerald-600'
              )}
            />
          </div>
        </CardHeader>
        <CardContent>
          {stockLoading ? (
            <div className="h-8 w-16 animate-pulse rounded bg-stone-200" />
          ) : (
            <p
              className={cn(
                'text-2xl font-semibold',
                lowStock && lowStock > 0 ? 'text-amber-600' : 'text-emerald-600'
              )}
            >
              {lowStock || 0}
            </p>
          )}
          <p className="mt-1 text-xs text-stone-500">
            Components below safety threshold
          </p>
        </CardContent>
      </Card>

      {/* Runway Placeholder */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-stone-600">
            Runway
          </CardTitle>
          <div className="rounded-lg bg-emerald-50 p-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-stone-400">--</p>
          <p className="mt-1 text-xs text-stone-500">
            Set up cash balance to calculate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
