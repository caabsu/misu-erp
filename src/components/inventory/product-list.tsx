'use client';

import { useState } from 'react';
import { Box, Wrench } from 'lucide-react';
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
import { useProducts, useAssembleProduct } from '@/lib/hooks/use-inventory';
import { toast } from 'sonner';
import type { ProductWithBOM } from '@/types/supabase';

export function ProductList() {
  const { data: products, isLoading, error } = useProducts();
  const [assembleProduct, setAssembleProduct] = useState<ProductWithBOM | null>(
    null
  );
  const [assembleQuantity, setAssembleQuantity] = useState('');
  const assembleMutation = useAssembleProduct();

  const handleAssemble = async () => {
    if (!assembleProduct || !assembleQuantity) return;

    const quantity = parseInt(assembleQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await assembleMutation.mutateAsync({
        productId: assembleProduct.id,
        quantity,
        bom: assembleProduct.product_bom,
      });
      toast.success(`Assembled ${quantity} units of ${assembleProduct.name}`);
      setAssembleProduct(null);
      setAssembleQuantity('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assemble product';
      toast.error(message);
    }
  };

  // Check if we can assemble a product based on BOM and current component stocks
  const getMaxAssemblable = (product: ProductWithBOM): number => {
    if (!product.product_bom || product.product_bom.length === 0) return 0;

    let maxUnits = Infinity;
    for (const item of product.product_bom) {
      if (!item.components || !item.quantity_required) continue;
      const canMake = Math.floor(
        item.components.current_stock / item.quantity_required
      );
      maxUnits = Math.min(maxUnits, canMake);
    }
    return maxUnits === Infinity ? 0 : maxUnits;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="flex items-center justify-between py-4">
              <div className="h-5 w-32 rounded bg-stone-200" />
              <div className="h-8 w-24 rounded bg-stone-200" />
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
          Failed to load products. Please check your connection.
        </CardContent>
      </Card>
    );
  }

  if (!products || products.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Box className="mb-4 h-12 w-12 text-stone-300" />
          <p className="text-stone-600">No products found</p>
          <p className="text-sm text-stone-400">
            Add finished goods to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {products.map((product) => {
          const maxAssemblable = getMaxAssemblable(product);
          const hasBOM =
            product.product_bom && product.product_bom.length > 0;

          return (
            <Card key={product.id} className="transition-all hover:shadow-md">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-100">
                    <Box className="h-5 w-5 text-stone-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-stone-900">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <span>
                        {product.current_stock} in stock
                      </span>
                      {product.sku && (
                        <>
                          <span className="text-stone-300">•</span>
                          <span className="font-mono text-xs">{product.sku}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {hasBOM && (
                    <Badge
                      variant="outline"
                      className="border-stone-200 text-stone-500"
                    >
                      Can make: {maxAssemblable}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAssembleProduct(product)}
                    disabled={!hasBOM || maxAssemblable === 0}
                    className="gap-1"
                  >
                    <Wrench className="h-4 w-4" />
                    Assemble
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assembler Modal */}
      <Dialog
        open={!!assembleProduct}
        onOpenChange={(open) => !open && setAssembleProduct(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assemble {assembleProduct?.name}</DialogTitle>
            <DialogDescription>
              Build finished goods from raw materials
            </DialogDescription>
          </DialogHeader>

          {assembleProduct && (
            <div className="py-4">
              {/* BOM Requirements */}
              <div className="mb-4 rounded-lg bg-stone-50 p-3">
                <p className="mb-2 text-sm font-medium text-stone-700">
                  Materials required per unit:
                </p>
                <ul className="space-y-1">
                  {assembleProduct.product_bom.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-stone-600">
                        {item.components?.name}
                      </span>
                      <span className="font-mono text-stone-500">
                        {item.quantity_required}{' '}
                        {item.components?.unit_type || 'units'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Label htmlFor="assemble-quantity">How many units to build?</Label>
              <Input
                id="assemble-quantity"
                type="number"
                min="1"
                max={getMaxAssemblable(assembleProduct)}
                placeholder="Enter quantity"
                value={assembleQuantity}
                onChange={(e) => setAssembleQuantity(e.target.value)}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-stone-500">
                Maximum: {getMaxAssemblable(assembleProduct)} units based on
                available materials
              </p>

              {/* Preview of materials to be used */}
              {assembleQuantity && parseInt(assembleQuantity, 10) > 0 && (
                <div className="mt-4 rounded-lg border border-stone-200 p-3">
                  <p className="mb-2 text-sm font-medium text-stone-700">
                    Materials to be used:
                  </p>
                  <ul className="space-y-1">
                    {assembleProduct.product_bom.map((item) => {
                      const qty = parseInt(assembleQuantity, 10);
                      const required = (item.quantity_required || 0) * qty;
                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-stone-600">
                            {item.components?.name}
                          </span>
                          <span className="font-mono text-rose-600">
                            -{required} {item.components?.unit_type || 'units'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAssembleProduct(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssemble}
              disabled={assembleMutation.isPending}
            >
              {assembleMutation.isPending ? 'Assembling...' : 'Confirm Assembly'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
