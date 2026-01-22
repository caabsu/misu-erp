'use client';

import { useState } from 'react';
import { Package, AlertTriangle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useComponents, useRestockComponent } from '@/lib/hooks/use-inventory';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Component } from '@/types/supabase';

export function ComponentGrid() {
  const { data: components, isLoading, error } = useComponents();
  const [restockComponent, setRestockComponent] = useState<Component | null>(
    null
  );
  const [restockQuantity, setRestockQuantity] = useState('');
  const restockMutation = useRestockComponent();

  const handleRestock = async () => {
    if (!restockComponent || !restockQuantity) return;

    const quantity = parseFloat(restockQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await restockMutation.mutateAsync({
        componentId: restockComponent.id,
        quantity,
      });
      toast.success(`Restocked ${quantity} ${restockComponent.unit_type || 'units'} of ${restockComponent.name}`);
      setRestockComponent(null);
      setRestockQuantity('');
    } catch (err) {
      toast.error('Failed to restock component');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded bg-stone-200" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 rounded bg-stone-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="py-6 text-center text-rose-700">
          Failed to load components. Please check your connection.
        </CardContent>
      </Card>
    );
  }

  if (!components || components.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="mb-4 h-12 w-12 text-stone-300" />
          <p className="text-stone-600">No components found</p>
          <p className="text-sm text-stone-400">
            Add raw materials to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {components.map((component) => {
          const isLowStock =
            component.current_stock < component.safety_stock_threshold;
          return (
            <Card
              key={component.id}
              className={cn(
                'transition-all hover:shadow-md',
                isLowStock && 'border-amber-300 bg-amber-50/50'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base font-medium text-stone-700">
                    {component.name}
                  </CardTitle>
                  {isLowStock && (
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-amber-100 text-amber-700"
                    >
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Low Stock
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-semibold text-stone-900">
                      {component.current_stock}
                    </p>
                    <p className="text-sm text-stone-500">
                      {component.unit_type || 'units'}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRestockComponent(component)}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Restock
                  </Button>
                </div>
                {component.cost_per_unit && (
                  <p className="mt-2 text-xs text-stone-400">
                    ${component.cost_per_unit.toFixed(2)} per{' '}
                    {component.unit_type || 'unit'}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Restock Modal */}
      <Dialog
        open={!!restockComponent}
        onOpenChange={(open) => !open && setRestockComponent(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restock {restockComponent?.name}</DialogTitle>
            <DialogDescription>
              Current stock: {restockComponent?.current_stock}{' '}
              {restockComponent?.unit_type || 'units'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="quantity">Quantity to add</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              placeholder={`Enter ${restockComponent?.unit_type || 'units'}`}
              value={restockQuantity}
              onChange={(e) => setRestockQuantity(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestockComponent(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRestock}
              disabled={restockMutation.isPending}
            >
              {restockMutation.isPending ? 'Restocking...' : 'Confirm Restock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
