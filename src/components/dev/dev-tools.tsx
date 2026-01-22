'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Trash2, Wrench } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const DELETE_ALL_UUID_SENTINEL = '00000000-0000-0000-0000-000000000000';

async function deleteAllRows(table: string) {
  const { error } = await supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .from(table as any)
    .delete()
    .neq('id', DELETE_ALL_UUID_SENTINEL);
  if (error) throw error;
}

async function resetFinanceData() {
  // Order matters due to foreign keys.
  await deleteAllRows('expenses');
  await deleteAllRows('recurring_rules');
  await deleteAllRows('vendors');
}

async function resetSubscriptionData() {
  await deleteAllRows('analytics_monthly_metrics');
}

async function resetInventoryData() {
  // Ensure BOM is cleared before components (FK restrict).
  await deleteAllRows('product_bom');
  await deleteAllRows('products');
  await deleteAllRows('components');
}

async function resetAllData() {
  await resetFinanceData();
  await resetSubscriptionData();
  await resetInventoryData();
}

export function DevTools() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [unlock, setUnlock] = useState('');
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const unlocked = unlock.trim().toUpperCase() === 'RESET';

  const run = async (key: string, label: string, fn: () => Promise<void>) => {
    if (!unlocked) {
      toast.error('Type RESET to unlock destructive actions');
      return;
    }

    const confirmed = confirm(
      `${label}\n\nThis will permanently delete data from Supabase. Continue?`
    );
    if (!confirmed) return;

    setBusyKey(key);
    try {
      await fn();
      await queryClient.invalidateQueries();
      toast.success(label);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      toast.error(`Failed: ${message}`);
    } finally {
      setBusyKey(null);
    }
  };

  const isBusy = busyKey !== null;

  return (
    <>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full border border-stone-200 bg-white shadow-md hover:bg-stone-50"
        onClick={() => setOpen(true)}
        aria-label="Open developer tools"
        title="Dev Tools"
      >
        <Wrench className="h-5 w-5 text-stone-700" />
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setUnlock('');
            setBusyKey(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Dev Tools (Temporary)
            </DialogTitle>
            <DialogDescription>
              Use these tools to reset demo/dev data while the product is in
              flux.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Danger zone: destructive actions. No undo.
            </div>

            <div>
              <Label htmlFor="devtools-unlock" className="text-xs text-stone-500">
                Type RESET to unlock
              </Label>
              <Input
                id="devtools-unlock"
                value={unlock}
                onChange={(event) => setUnlock(event.target.value)}
                placeholder="RESET"
                className="mt-1 font-mono"
              />
            </div>

            <Separator />

            <div className="grid gap-3">
              <Button
                variant="destructive"
                className="justify-between"
                disabled={!unlocked || isBusy}
                onClick={() => run('finance', 'Reset Finance data', resetFinanceData)}
              >
                <span>Reset Finance data</span>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                className="justify-between"
                disabled={!unlocked || isBusy}
                onClick={() =>
                  run('subscriptions', 'Reset Subscription metrics', resetSubscriptionData)
                }
              >
                <span>Reset Subscription metrics</span>
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="destructive"
                className="justify-between"
                disabled={!unlocked || isBusy}
                onClick={() =>
                  run('inventory', 'Reset Inventory data', resetInventoryData)
                }
              >
                <span>Reset Inventory data</span>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            <Button
              variant="destructive"
              className="justify-between"
              disabled={!unlocked || isBusy}
              onClick={() => run('all', 'Reset ALL data', resetAllData)}
            >
              <span>Reset ALL data</span>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isBusy}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
