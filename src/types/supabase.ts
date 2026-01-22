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
  description: string | null;
  amount: number;
  category: ExpenseCategory;
  frequency: 'monthly' | 'yearly';
  next_due_date: string | null;
  active: boolean;
  created_at: string;
}

export interface RecurringRuleInsert {
  vendor_id?: string | null;
  description?: string | null;
  amount: number;
  category: ExpenseCategory;
  frequency: 'monthly' | 'yearly';
  next_due_date?: string | null;
  active?: boolean;
}

export interface RecurringRuleWithVendor extends RecurringRule {
  vendors: Vendor | null;
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
  // Pricing tiers
  cost_price: number | null;      // Cost to produce/acquire (COGS)
  retail_price: number | null;    // Standard retail price
  wholesale_price: number | null; // Bulk/wholesale price
  sale_price: number | null;      // Legacy/promotional price
  sop_markdown: string | null;
}

export interface ProductInsert {
  name: string;
  sku?: string | null;
  current_stock?: number;
  cost_price?: number | null;
  retail_price?: number | null;
  wholesale_price?: number | null;
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

export interface AnalyticsMonthlyMetric {
  id: string;
  month: string;
  new_subscribers: number;
  active_subscribers: number;
  churned_subscribers: number;
  total_revenue: number;
  marketing_spend: number;
}

export interface AnalyticsMonthlyMetricInsert {
  month: string;
  new_subscribers?: number;
  active_subscribers?: number;
  churned_subscribers?: number;
  total_revenue?: number;
  marketing_spend?: number;
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
      analytics_monthly_metrics: {
        Row: AnalyticsMonthlyMetric;
        Insert: AnalyticsMonthlyMetricInsert;
        Update: Partial<AnalyticsMonthlyMetricInsert>;
      };
    };
  };
}
