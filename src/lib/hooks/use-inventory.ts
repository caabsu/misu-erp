import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  Component,
  ComponentInsert,
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

// Fetch BOM for a specific product
export function useProductBOM(productId?: string) {
  return useQuery({
    queryKey: ['product-bom', productId],
    enabled: !!productId,
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('product_bom')
        .select('*, components (*)')
        .eq('product_id', productId);
      if (error) throw error;
      return data as ProductBOMWithComponent[];
    },
  });
}

// Create a component
export function useCreateComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (component: ComponentInsert) => {
      const { data, error } = await supabase
        .from('components')
        .insert(component)
        .select()
        .single();
      if (error) throw error;
      return data as Component;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });
}

// Update a component
export function useUpdateComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<ComponentInsert>;
    }) => {
      const { data, error } = await supabase
        .from('components')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Component;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
    },
  });
}

// Update component stock
export function useUpdateComponentStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      componentId,
      quantity,
      operation,
    }: {
      componentId: string;
      quantity: number;
      operation: 'add' | 'subtract' | 'set';
    }) => {
      const { data: component, error: fetchError } = await supabase
        .from('components')
        .select('current_stock')
        .eq('id', componentId)
        .single();

      if (fetchError) throw fetchError;

      const currentStock = (component as { current_stock: number }).current_stock || 0;
      let newStock: number;

      switch (operation) {
        case 'add':
          newStock = currentStock + quantity;
          break;
        case 'subtract':
          newStock = Math.max(0, currentStock - quantity);
          break;
        case 'set':
          newStock = quantity;
          break;
      }

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

// Delete a component
export function useDeleteComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (componentId: string) => {
      const { error } = await supabase
        .from('components')
        .delete()
        .eq('id', componentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
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
