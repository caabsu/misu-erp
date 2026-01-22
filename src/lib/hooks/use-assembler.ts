import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProductBOMWithComponent } from '@/types/supabase';

export function useAssembler() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      quantity,
      bom,
    }: {
      productId: string;
      quantity: number;
      bom: ProductBOMWithComponent[];
    }) => {
      if (!bom || bom.length === 0) {
        throw new Error('No BOM defined for this product');
      }

      for (const item of bom) {
        if (!item.components || !item.quantity_required) continue;
        const required = quantity * item.quantity_required;
        if (item.components.current_stock < required) {
          throw new Error(
            `Insufficient Raw Materials: ${item.components.name} (need ${required}, have ${item.components.current_stock})`
          );
        }
      }

      for (const item of bom) {
        if (!item.components || !item.quantity_required) continue;
        const required = quantity * item.quantity_required;
        const newStock = item.components.current_stock - required;

        const { error } = await supabase
          .from('components')
          .update({ current_stock: newStock })
          .eq('id', item.component_id!);

        if (error) throw error;
      }

      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('current_stock')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      const newProductStock = (product.current_stock || 0) + quantity;
      const { error: updateError } = await supabase
        .from('products')
        .update({ current_stock: newProductStock })
        .eq('id', productId);

      if (updateError) throw updateError;

      return { newProductStock };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
