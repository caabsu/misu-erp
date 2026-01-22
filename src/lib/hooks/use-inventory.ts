import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  Component,
  Product,
  ProductWithBOM,
  ProductBOMWithComponent,
} from '@/types/supabase';

// Fetch all components
export function useComponents() {
  return useQuery({
    queryKey: ['components'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('components')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as Component[];
    },
  });
}

// Fetch all products with their BOMs
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(
          `
          *,
          product_bom (
            *,
            components (*)
          )
        `
        )
        .order('name');
      if (error) throw error;
      return data as ProductWithBOM[];
    },
  });
}

// Restock a component
export function useRestockComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      componentId,
      quantity,
    }: {
      componentId: string;
      quantity: number;
    }) => {
      // First get current stock
      const { data: component, error: fetchError } = await supabase
        .from('components')
        .select('current_stock')
        .eq('id', componentId)
        .single();

      if (fetchError) throw fetchError;

      // Update with new stock
      const newStock = (component.current_stock || 0) + quantity;
      const { error: updateError } = await supabase
        .from('components')
        .update({ current_stock: newStock })
        .eq('id', componentId);

      if (updateError) throw updateError;
      return newStock;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });
}

// Assemble products - the core kitting logic
export function useAssembleProduct() {
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
      // Validate we have enough materials
      for (const item of bom) {
        if (!item.components || !item.quantity_required) continue;
        const required = quantity * item.quantity_required;
        if (item.components.current_stock < required) {
          throw new Error(
            `Not enough ${item.components.name}. Need ${required} ${item.components.unit_type || 'units'}, have ${item.components.current_stock}`
          );
        }
      }

      // Decrement component stocks
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

      // Increment product stock
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
