'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, MoreHorizontal, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useComponents,
  useCreateComponent,
  useUpdateComponent,
  useUpdateComponentStock,
  useDeleteComponent,
} from '@/lib/hooks/use-inventory';
import { toast } from 'sonner';
import type { Component, ComponentInsert } from '@/types/supabase';

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

export function ComponentTable() {
  const { data: components, isLoading, error } = useComponents();
  const createMutation = useCreateComponent();
  const updateMutation = useUpdateComponent();
  const stockMutation = useUpdateComponentStock();
  const deleteMutation = useDeleteComponent();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [stockComponent, setStockComponent] = useState<Component | null>(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockOperation, setStockOperation] = useState<'add' | 'subtract' | 'set'>('add');

  const [formData, setFormData] = useState<ComponentInsert>({
    name: '',
    current_stock: 0,
    unit_type: '',
    cost_per_unit: null,
    safety_stock_threshold: 0,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      current_stock: 0,
      unit_type: '',
      cost_per_unit: null,
      safety_stock_threshold: 0,
    });
  };

  const openEditDialog = (component: Component) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      current_stock: component.current_stock,
      unit_type: component.unit_type || '',
      cost_per_unit: component.cost_per_unit,
      safety_stock_threshold: component.safety_stock_threshold,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Component name is required');
      return;
    }

    try {
      if (editingComponent) {
        await updateMutation.mutateAsync({
          id: editingComponent.id,
          updates: formData,
        });
        toast.success('Component updated');
        setEditingComponent(null);
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Component created');
        setShowAddDialog(false);
      }
      resetForm();
    } catch {
      toast.error('Failed to save component');
    }
  };

  const handleStockUpdate = async () => {
    if (!stockComponent || !stockQuantity) return;

    const quantity = parseFloat(stockQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await stockMutation.mutateAsync({
        componentId: stockComponent.id,
        quantity,
        operation: stockOperation,
      });
      toast.success('Component stock updated');
      setStockComponent(null);
      setStockQuantity('');
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const handleDelete = async (component: Component) => {
    if (!confirm(`Delete "${component.name}"? This cannot be undone.`)) return;

    try {
      await deleteMutation.mutateAsync(component.id);
      toast.success('Component deleted');
    } catch {
      toast.error('Failed to delete component');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
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
          Failed to load components. Please check your connection.
        </CardContent>
      </Card>
    );
  }

  const componentFormContent = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="component-name">Component Name *</Label>
          <Input
            id="component-name"
            placeholder="e.g., Pouch"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="component-unit">Unit Type</Label>
          <Input
            id="component-unit"
            placeholder="e.g., units, kg"
            value={formData.unit_type || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, unit_type: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="component-stock">Current Stock</Label>
          <Input
            id="component-stock"
            type="number"
            min="0"
            value={formData.current_stock || 0}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, current_stock: parseFloat(e.target.value) || 0 }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="component-safety">Safety Stock Threshold</Label>
          <Input
            id="component-safety"
            type="number"
            min="0"
            value={formData.safety_stock_threshold || 0}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                safety_stock_threshold: parseInt(e.target.value, 10) || 0,
              }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="component-cost">Cost per Unit</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
              $
            </span>
            <Input
              id="component-cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.cost_per_unit ?? ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  cost_per_unit: e.target.value ? parseFloat(e.target.value) : null,
                }))
              }
              className="pl-7"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">
            {components?.length || 0} component{(components?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Component
        </Button>
      </div>

      {!components || components.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-4 h-12 w-12 text-stone-300" />
            <p className="text-stone-600">No components yet</p>
            <p className="text-sm text-stone-400">
              Add raw materials to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Unit</TableHead>
                <TableHead className="text-right">Safety</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => {
                const isLowStock =
                  component.current_stock < component.safety_stock_threshold;
                return (
                  <TableRow key={component.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium text-stone-900">
                            {component.name}
                          </p>
                          {isLowStock && (
                            <Badge
                              variant="outline"
                              className="mt-1 border-amber-300 bg-amber-100 text-amber-700"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Low Stock
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setStockComponent(component)}
                        className="rounded-md px-2 py-1 font-medium text-stone-900 hover:bg-stone-100"
                      >
                        {component.current_stock}
                      </button>
                    </TableCell>
                    <TableCell className="text-right text-stone-600">
                      {component.unit_type || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-600">
                      {component.safety_stock_threshold}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-600">
                      {formatCurrency(component.cost_per_unit)}
                    </TableCell>
                    <TableCell>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-40">
                          <div className="grid gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start gap-2"
                              onClick={() => openEditDialog(component)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => handleDelete(component)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Component</DialogTitle>
            <DialogDescription>Add a raw material to your inventory</DialogDescription>
          </DialogHeader>
          {componentFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Component'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingComponent}
        onOpenChange={(open) => !open && setEditingComponent(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Component</DialogTitle>
            <DialogDescription>Update component details</DialogDescription>
          </DialogHeader>
          {componentFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingComponent(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!stockComponent}
        onOpenChange={(open) => !open && setStockComponent(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              {stockComponent?.name} - Current: {stockComponent?.current_stock}{' '}
              {stockComponent?.unit_type || 'units'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <Button
                variant={stockOperation === 'add' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStockOperation('add')}
                className="flex-1"
              >
                Add
              </Button>
              <Button
                variant={stockOperation === 'subtract' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStockOperation('subtract')}
                className="flex-1"
              >
                Remove
              </Button>
              <Button
                variant={stockOperation === 'set' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStockOperation('set')}
                className="flex-1"
              >
                Set
              </Button>
            </div>
            <div>
              <Label htmlFor="component-quantity">Quantity</Label>
              <Input
                id="component-quantity"
                type="number"
                min="0"
                placeholder="Enter quantity"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockComponent(null)}>
              Cancel
            </Button>
            <Button onClick={handleStockUpdate} disabled={stockMutation.isPending}>
              {stockMutation.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
