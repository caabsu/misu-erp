// Database Types for Misu ERP
// Generated from Supabase PostgreSQL schema

export interface Vendor {
  id: string;
  name: string;
  default_category: string | null;
  website_url: string | null;
}

export interface VendorInsert {
  name: string;
  default_category?: string | null;
  website_url?: string | null;
}

export interface Expense {
  id: string;
  created_at: string;
  date: string;
  description: string | null;
  amount: number;
  category: 'OpEx' | 'COGS' | 'Marketing';
  vendor_id: string | null;
  is_recurring: boolean;
  receipt_url: string | null;
}

export interface ExpenseInsert {
  date: string;
  description?: string | null;
  amount: number;
  category: 'OpEx' | 'COGS' | 'Marketing';
  vendor_id?: string | null;
  is_recurring?: boolean;
  receipt_url?: string | null;
}

export interface ExpenseWithVendor extends Expense {
  vendors: Vendor | null;
}

export interface RecurringRule {
  id: string;
  vendor_id: string | null;
  amount: number | null;
  frequency: 'monthly' | 'yearly' | null;
  next_due_date: string | null;
  active: boolean;
}

export interface Component {
  id: string;
  name: string;
  current_stock: number;
  unit_type: string | null;
  cost_per_unit: number | null;
  safety_stock_threshold: number;
}

export interface ComponentInsert {
  name: string;
  current_stock?: number;
  unit_type?: string | null;
  cost_per_unit?: number | null;
  safety_stock_threshold?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  current_stock: number;
  sale_price: number | null;
  sop_markdown: string | null;
}

export interface ProductInsert {
  name: string;
  sku?: string | null;
  current_stock?: number;
  sale_price?: number | null;
  sop_markdown?: string | null;
}

export interface ProductBOM {
  id: string;
  product_id: string | null;
  component_id: string | null;
  quantity_required: number | null;
}

export interface ProductBOMWithComponent extends ProductBOM {
  components: Component | null;
}

export interface ProductWithBOM extends Product {
  product_bom: ProductBOMWithComponent[];
}

// Category types
export type ExpenseCategory = 'OpEx' | 'COGS' | 'Marketing';

// Utility type for database operations
export interface Database {
  public: {
    Tables: {
      vendors: {
        Row: Vendor;
        Insert: VendorInsert;
        Update: Partial<VendorInsert>;
      };
      expenses: {
        Row: Expense;
        Insert: ExpenseInsert;
        Update: Partial<ExpenseInsert>;
      };
      recurring_rules: {
        Row: RecurringRule;
        Insert: Partial<RecurringRule>;
        Update: Partial<RecurringRule>;
      };
      components: {
        Row: Component;
        Insert: ComponentInsert;
        Update: Partial<ComponentInsert>;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: Partial<ProductInsert>;
      };
      product_bom: {
        Row: ProductBOM;
        Insert: Partial<ProductBOM>;
        Update: Partial<ProductBOM>;
      };
    };
  };
}
