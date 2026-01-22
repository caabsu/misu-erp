import { ComponentGrid } from '@/components/inventory/component-grid';
import { ProductList } from '@/components/inventory/product-list';
import { Separator } from '@/components/ui/separator';

export default function InventoryPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Inventory</h1>
        <p className="text-stone-500">
          Manage raw materials and assemble finished goods
        </p>
      </div>

      {/* Raw Materials Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-stone-800">Raw Materials</h2>
        </div>
        <ComponentGrid />
      </section>

      <Separator />

      {/* Finished Goods Section */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-medium text-stone-800">Finished Goods</h2>
        </div>
        <ProductList />
      </section>
    </div>
  );
}
