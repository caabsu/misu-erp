'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Package, MoreHorizontal, Wrench } from 'lucide-react';
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
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useUpdateStock,
  useDeleteProduct,
} from '@/lib/hooks/use-products';
import { useProductBOM } from '@/lib/hooks/use-inventory';
import { useAssembler } from '@/lib/hooks/use-assembler';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Product, ProductBOMWithComponent, ProductInsert } from '@/types/supabase';

const formatCurrency = (value: number | null) => {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const calculateMargin = (retail: number | null, cost: number | null) => {
  if (!retail || !cost || cost === 0) return null;
  return ((retail - cost) / retail) * 100;
};

const getMaxAssemblable = (bom: ProductBOMWithComponent[] | undefined) => {
  if (!bom || bom.length === 0) return 0;
  let maxUnits = Infinity;
  for (const item of bom) {
    if (!item.components || !item.quantity_required) continue;
    const canMake = Math.floor(
      item.components.current_stock / item.quantity_required
    );
    maxUnits = Math.min(maxUnits, canMake);
  }
  return maxUnits === Infinity ? 0 : maxUnits;
};

export function ProductTable() {
  const { data: products, isLoading, error } = useProducts();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const stockMutation = useUpdateStock();
  const deleteMutation = useDeleteProduct();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockOperation, setStockOperation] = useState<'add' | 'subtract' | 'set'>('add');
  const [assembleProduct, setAssembleProduct] = useState<Product | null>(null);
  const [assembleQuantity, setAssembleQuantity] = useState('');
  const { data: bomItems, isLoading: bomLoading } = useProductBOM(assembleProduct?.id);
  const assembleMutation = useAssembler();

  // Form state
  const [formData, setFormData] = useState<ProductInsert>({
    name: '',
    sku: '',
    current_stock: 0,
    cost_price: null,
    retail_price: null,
    wholesale_price: null,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      current_stock: 0,
      cost_price: null,
      retail_price: null,
      wholesale_price: null,
    });
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      current_stock: product.current_stock,
      cost_price: product.cost_price,
      retail_price: product.retail_price,
      wholesale_price: product.wholesale_price,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    try {
      if (editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          updates: formData,
        });
        toast.success('Product updated');
        setEditingProduct(null);
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Product created');
        setShowAddDialog(false);
      }
      resetForm();
    } catch {
      toast.error('Failed to save product');
    }
  };

  const handleStockUpdate = async () => {
    if (!stockProduct || !stockQuantity) return;

    const quantity = parseFloat(stockQuantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      await stockMutation.mutateAsync({
        productId: stockProduct.id,
        quantity,
        operation: stockOperation,
      });
      toast.success('Stock updated');
      setStockProduct(null);
      setStockQuantity('');
    } catch {
      toast.error('Failed to update stock');
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    try {
      await deleteMutation.mutateAsync(product.id);
      toast.success('Product deleted');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleAssemble = async () => {
    if (!assembleProduct || !assembleQuantity) return;

    const quantity = parseInt(assembleQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!bomItems || bomItems.length === 0) {
      toast.error('No BOM defined for this product');
      return;
    }

    const maxAssemblable = getMaxAssemblable(bomItems);
    if (quantity > maxAssemblable) {
      toast.error('Insufficient Raw Materials');
      return;
    }

    try {
      await assembleMutation.mutateAsync({
        productId: assembleProduct.id,
        quantity,
        bom: bomItems,
      });
      toast.success(`Assembled ${quantity} units of ${assembleProduct.name}`);
      setAssembleProduct(null);
      setAssembleQuantity('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to assemble product';
      toast.error(message);
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
          Failed to load products. Please check your connection.
        </CardContent>
      </Card>
    );
  }

  const productFormContent = (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="product-name">Product Name *</Label>
          <Input
            id="product-name"
            placeholder="e.g., Misu Starter Kit"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="product-sku">SKU</Label>
          <Input
            id="product-sku"
            placeholder="e.g., MSK-001"
            value={formData.sku || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="product-stock">Current Stock</Label>
          <Input
            id="product-stock"
            type="number"
            min="0"
            value={formData.current_stock || 0}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, current_stock: parseInt(e.target.value) || 0 }))
            }
            className="mt-1"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <p className="mb-3 text-sm font-medium text-stone-700">Pricing</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label htmlFor="product-cost" className="text-xs text-stone-500">
              Cost Price
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                $
              </span>
              <Input
                id="product-cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.cost_price ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cost_price: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                className="pl-7"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="product-retail" className="text-xs text-stone-500">
              Retail Price
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                $
              </span>
              <Input
                id="product-retail"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.retail_price ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    retail_price: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                className="pl-7"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="product-wholesale" className="text-xs text-stone-500">
              Wholesale Price
            </Label>
            <div className="relative mt-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                $
              </span>
              <Input
                id="product-wholesale"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={formData.wholesale_price ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    wholesale_price: e.target.value ? parseFloat(e.target.value) : null,
                  }))
                }
                className="pl-7"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const maxAssemblable = getMaxAssemblable(bomItems);
  const assembleQty = parseInt(assembleQuantity, 10);

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">
            {products?.length || 0} product{(products?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {!products || products.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="mb-4 h-12 w-12 text-stone-300" />
            <p className="text-stone-600">No products yet</p>
            <p className="text-sm text-stone-400">
              Add your first product to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="text-right">Retail</TableHead>
                <TableHead className="text-right">Wholesale</TableHead>
                <TableHead className="text-right">Margin</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => {
                const margin = calculateMargin(product.retail_price, product.cost_price);
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-stone-900">{product.name}</p>
                        {product.sku && (
                          <p className="font-mono text-xs text-stone-400">
                            {product.sku}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => setStockProduct(product)}
                        className="rounded-md px-2 py-1 font-medium text-stone-900 hover:bg-stone-100"
                      >
                        {product.current_stock}
                      </button>
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-600">
                      {formatCurrency(product.cost_price)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-900">
                      {formatCurrency(product.retail_price)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-stone-600">
                      {formatCurrency(product.wholesale_price)}
                    </TableCell>
                    <TableCell className="text-right">
                      {margin !== null ? (
                        <Badge
                          variant="outline"
                          className={cn(
                            margin >= 50
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : margin >= 30
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-rose-200 bg-rose-50 text-rose-700'
                          )}
                        >
                          {margin.toFixed(0)}%
                        </Badge>
                      ) : (
                        <span className="text-stone-400">-</span>
                      )}
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
                              onClick={() => openEditDialog(product)}
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start gap-2"
                              onClick={() => {
                                setAssembleProduct(product);
                                setAssembleQuantity('');
                              }}
                            >
                              <Wrench className="h-4 w-4" />
                              Assemble
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="justify-start gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              onClick={() => handleDelete(product)}
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

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Add a new product to your inventory</DialogDescription>
          </DialogHeader>
          {productFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={(open) => !open && setEditingProduct(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update product details</DialogDescription>
          </DialogHeader>
          {productFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock Update Dialog */}
      <Dialog open={!!stockProduct} onOpenChange={(open) => !open && setStockProduct(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
            <DialogDescription>
              {stockProduct?.name} - Current: {stockProduct?.current_stock} units
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
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
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
            <Button variant="outline" onClick={() => setStockProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleStockUpdate} disabled={stockMutation.isPending}>
              {stockMutation.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assemble Product Dialog */}
      <Dialog
        open={!!assembleProduct}
        onOpenChange={(open) => {
          if (!open) {
            setAssembleProduct(null);
            setAssembleQuantity('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assemble {assembleProduct?.name}</DialogTitle>
            <DialogDescription>
              Build finished goods from raw materials
            </DialogDescription>
          </DialogHeader>

          {bomLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-stone-900" />
            </div>
          ) : !bomItems || bomItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
              No BOM defined for this product yet.
            </div>
          ) : (
            <div className="py-2">
              <div className="mb-4 rounded-lg bg-stone-50 p-3">
                <p className="mb-2 text-sm font-medium text-stone-700">
                  Materials required per unit:
                </p>
                <ul className="space-y-1">
                  {bomItems.map((item) => (
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
                max={maxAssemblable}
                placeholder="Enter quantity"
                value={assembleQuantity}
                onChange={(e) => setAssembleQuantity(e.target.value)}
                className="mt-2"
              />
              <p className="mt-1 text-xs text-stone-500">
                Maximum: {maxAssemblable} units based on available materials
              </p>

              {assembleQty > 0 && (
                <div className="mt-4 rounded-lg border border-stone-200 p-3">
                  <p className="mb-2 text-sm font-medium text-stone-700">
                    Materials to be used:
                  </p>
                  <ul className="space-y-1">
                    {bomItems.map((item) => {
                      const required = (item.quantity_required || 0) * assembleQty;
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
              onClick={() => {
                setAssembleProduct(null);
                setAssembleQuantity('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssemble}
              disabled={
                assembleMutation.isPending ||
                bomLoading ||
                !bomItems ||
                bomItems.length === 0 ||
                !assembleQuantity
              }
            >
              {assembleMutation.isPending ? 'Assembling...' : 'Confirm Assembly'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
