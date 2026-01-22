'use client';

import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, CalendarRange } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import type {
  AnalyticsMonthlyMetric,
  AnalyticsMonthlyMetricInsert,
} from '@/types/supabase';
import { fetchMarketingSpendForMonth } from '@/lib/hooks/use-subscriptions';

interface MetricsEntryTableProps {
  metrics: AnalyticsMonthlyMetric[] | undefined;
  isLoading: boolean;
  error: unknown;
  createMetric: {
    mutateAsync: (payload: AnalyticsMonthlyMetricInsert) => Promise<unknown>;
    isPending: boolean;
  };
  updateMetric: {
    mutateAsync: (payload: {
      id: string;
      updates: Partial<AnalyticsMonthlyMetricInsert>;
    }) => Promise<unknown>;
    isPending: boolean;
  };
  deleteMetric: {
    mutateAsync: (id: string) => Promise<unknown>;
    isPending: boolean;
  };
}

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const formatPercent = (value: number) =>
  `${(value * 100).toFixed(1)}%`;

const formatMonthLabel = (month: string) =>
  new Date(month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

export function MetricsEntryTable({
  metrics,
  isLoading,
  error,
  createMetric,
  updateMetric,
  deleteMetric,
}: MetricsEntryTableProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingMetric, setEditingMetric] = useState<AnalyticsMonthlyMetric | null>(null);
  const [formData, setFormData] = useState({
    month: '',
    new_subscribers: '',
    churned_subscribers: '',
    active_subscribers: '',
    marketing_spend: '',
    total_revenue: '',
  });

  const sortedMetrics = useMemo(() => {
    return [...(metrics || [])].sort((a, b) => a.month.localeCompare(b.month));
  }, [metrics]);

  const openAddDialog = () => {
    setEditingMetric(null);
    setFormData({
      month: '',
      new_subscribers: '',
      churned_subscribers: '',
      active_subscribers: '',
      marketing_spend: '',
      total_revenue: '',
    });
    setShowDialog(true);
  };

  const openEditDialog = (metric: AnalyticsMonthlyMetric) => {
    setEditingMetric(metric);
    setFormData({
      month: metric.month.slice(0, 7),
      new_subscribers: metric.new_subscribers.toString(),
      churned_subscribers: metric.churned_subscribers.toString(),
      active_subscribers: metric.active_subscribers.toString(),
      marketing_spend: metric.marketing_spend.toString(),
      total_revenue: metric.total_revenue.toString(),
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.month) {
      toast.error('Month is required');
      return;
    }

    const payload: AnalyticsMonthlyMetricInsert = {
      month: `${formData.month}-01`,
      new_subscribers: parseInt(formData.new_subscribers, 10) || 0,
      churned_subscribers: parseInt(formData.churned_subscribers, 10) || 0,
      active_subscribers: parseInt(formData.active_subscribers, 10) || 0,
      marketing_spend: parseFloat(formData.marketing_spend) || 0,
      total_revenue: parseFloat(formData.total_revenue) || 0,
    };

    try {
      if (editingMetric) {
        await updateMetric.mutateAsync({ id: editingMetric.id, updates: payload });
        toast.success('Metrics updated');
      } else {
        await createMetric.mutateAsync(payload);
        toast.success('Metrics added');
      }
      setShowDialog(false);
    } catch {
      toast.error('Failed to save metrics');
    }
  };

  const handleDelete = async (metric: AnalyticsMonthlyMetric) => {
    if (!confirm(`Delete metrics for ${formatMonthLabel(metric.month)}?`)) return;

    try {
      await deleteMetric.mutateAsync(metric.id);
      toast.success('Metrics deleted');
    } catch {
      toast.error('Failed to delete metrics');
    }
  };

  const handleAutoFill = async () => {
    if (!formData.month) {
      toast.error('Select a month first');
      return;
    }

    try {
      const spend = await fetchMarketingSpendForMonth(`${formData.month}-01`);
      setFormData((prev) => ({
        ...prev,
        marketing_spend: spend.toFixed(2),
      }));
      toast.success('Marketing spend loaded');
    } catch {
      toast.error('Failed to fetch marketing spend');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarRange className="h-4 w-4 text-stone-700" />
            Metrics Ledger
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center">
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
          Failed to load subscription metrics
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarRange className="h-4 w-4 text-stone-700" />
          Metrics Ledger
        </CardTitle>
        <Button size="sm" className="gap-2" onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Month
        </Button>
      </CardHeader>
      <CardContent>
        {sortedMetrics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-stone-400">
            No monthly metrics yet
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">New Subs</TableHead>
                <TableHead className="text-right">Lost Subs</TableHead>
                <TableHead className="text-right">Active Subs</TableHead>
                <TableHead className="text-right">Ad Spend</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead className="text-right">CAC</TableHead>
                <TableHead className="text-right">ARPU</TableHead>
                <TableHead className="text-right">Churn Rate</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMetrics.map((metric, index) => {
                const prevActive =
                  index > 0 ? sortedMetrics[index - 1].active_subscribers : null;
                const cac =
                  metric.new_subscribers > 0
                    ? metric.marketing_spend / metric.new_subscribers
                    : null;
                const arpu =
                  metric.active_subscribers > 0
                    ? metric.total_revenue / metric.active_subscribers
                    : null;
                const churnRate =
                  prevActive && prevActive > 0
                    ? metric.churned_subscribers / prevActive
                    : null;

                return (
                  <TableRow key={metric.id}>
                    <TableCell>{formatMonthLabel(metric.month)}</TableCell>
                    <TableCell className="text-right font-mono text-stone-700">
                      {metric.new_subscribers}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-700">
                      {metric.churned_subscribers}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-700">
                      {metric.active_subscribers}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-700">
                      {formatCurrency(metric.marketing_spend)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-700">
                      {formatCurrency(metric.total_revenue)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-700">
                      {cac !== null ? formatCurrency(cac) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-700">
                      {arpu !== null ? formatCurrency(arpu) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-700">
                      {churnRate !== null ? formatPercent(churnRate) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(metric)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => handleDelete(metric)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingMetric ? 'Edit Metrics' : 'Add Monthly Metrics'}
            </DialogTitle>
            <DialogDescription>
              Enter end-of-month subscription metrics
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="metric-month">Month</Label>
              <Input
                id="metric-month"
                type="month"
                value={formData.month}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    month: event.target.value,
                  }))
                }
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metric-new">New Subs</Label>
                <Input
                  id="metric-new"
                  type="number"
                  min="0"
                  value={formData.new_subscribers}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      new_subscribers: event.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="metric-lost">Lost Subs</Label>
                <Input
                  id="metric-lost"
                  type="number"
                  min="0"
                  value={formData.churned_subscribers}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      churned_subscribers: event.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="metric-active">Total Active</Label>
                <Input
                  id="metric-active"
                  type="number"
                  min="0"
                  value={formData.active_subscribers}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      active_subscribers: event.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="metric-spend">Ad Spend</Label>
                <Input
                  id="metric-spend"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.marketing_spend}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      marketing_spend: event.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
              <div className="col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoFill}
                >
                  Auto-fill marketing spend
                </Button>
              </div>
              <div className="col-span-2">
                <Label htmlFor="metric-revenue">Total Revenue</Label>
                <Input
                  id="metric-revenue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.total_revenue}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      total_revenue: event.target.value,
                    }))
                  }
                  className="mt-1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMetric.isPending || updateMetric.isPending}
            >
              {createMetric.isPending || updateMetric.isPending
                ? 'Saving...'
                : 'Save Metrics'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
