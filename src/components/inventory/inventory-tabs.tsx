'use client';

import { useState } from 'react';
import { ProductTable } from '@/components/inventory/product-table';
import { ComponentTable } from '@/components/inventory/component-table';
import { cn } from '@/lib/utils';

export function InventoryTabs() {
  const [view, setView] = useState<'products' | 'components'>('products');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">Inventory</h1>
        <p className="text-stone-500">
          Manage finished goods and raw materials
        </p>
      </div>

      <div className="flex w-fit items-center rounded-lg border border-stone-200 bg-white p-1 text-sm">
        <button
          onClick={() => setView('products')}
          className={cn(
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            view === 'products'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          )}
        >
          Products (Finished)
        </button>
        <button
          onClick={() => setView('components')}
          className={cn(
            'rounded-md px-3 py-1.5 font-medium transition-colors',
            view === 'components'
              ? 'bg-stone-900 text-white'
              : 'text-stone-600 hover:bg-stone-100'
          )}
        >
          Components (Raw)
        </button>
      </div>

      {view === 'products' ? <ProductTable /> : <ComponentTable />}
    </div>
  );
}
