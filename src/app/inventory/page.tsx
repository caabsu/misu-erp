import { ProductTable } from '@/components/inventory/product-table';

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Products</h1>
        <p className="text-stone-500">
          Manage your product catalog, pricing, and stock levels
        </p>
      </div>

      {/* Product Table */}
      <ProductTable />
    </div>
  );
}
