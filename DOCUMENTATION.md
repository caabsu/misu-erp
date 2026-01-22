# Misu ERP - Complete System Documentation

**Version:** 0.2.0
**Last Updated:** January 2026
**Technology Stack:** Next.js 16, React 19, TypeScript, Supabase, TanStack Query, ShadCN UI, Tailwind CSS

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Design System](#2-design-system)
3. [Application Architecture](#3-application-architecture)
4. [Module: Dashboard](#4-module-dashboard)
5. [Module: Finance](#5-module-finance)
6. [Module: Products](#6-module-products)
7. [Module: Settings](#7-module-settings)
8. [Database Schema](#8-database-schema)
9. [Technical Implementation](#9-technical-implementation)
10. [Future Roadmap](#10-future-roadmap)

---

## 1. System Overview

### 1.1 Purpose

Misu ERP is an internal operations management system designed for small-to-medium businesses. It provides centralized control over:

- **Financial tracking** - One-time expenses, recurring subscriptions, and cash burn analysis
- **Product management** - Catalog management with multi-tier pricing and inventory tracking
- **Business intelligence** - Real-time KPIs and activity monitoring

### 1.2 Key Features Summary

| Module | Primary Functions |
|--------|-------------------|
| Dashboard | KPI cards, recent activity feed, stock alerts |
| Finance | Expense ledger, recurring expenses, burn charts |
| Products | Product catalog, pricing tiers, stock management |
| Settings | System configuration (placeholder) |

### 1.3 User Access

- **Authentication:** Currently disabled (internal tool)
- **Authorization:** No role-based access control implemented
- **Security:** Row Level Security (RLS) compatible via Supabase anon key

---

## 2. Design System

### 2.1 Theme: "Clinical Warmth"

The design philosophy balances professional utility with approachable aesthetics. Key characteristics:

- Clean, medical-grade precision
- Warm, inviting color palette
- Generous whitespace
- Rounded corners (`rounded-xl`)

### 2.2 Color Palette

#### Base Colors
| Token | Tailwind Class | Usage |
|-------|----------------|-------|
| Background | `bg-stone-50` | Page background (warm off-white) |
| Surface | `bg-white` | Cards, dialogs, tables |
| Border | `border-stone-200` | Subtle dividers |
| Primary Text | `text-stone-900` | Headings, important content |
| Secondary Text | `text-stone-600` | Body text |
| Muted Text | `text-stone-400` | Placeholders, captions |

#### Accent Colors
| Semantic | Color | Usage |
|----------|-------|-------|
| Success/Profit | `emerald-600/700` | Positive metrics, margins > 50% |
| Warning/Caution | `amber-600/700` | Low stock alerts, margins 30-50% |
| Danger/Expense | `rose-600/700` | Expenses, deletions, margins < 30% |
| Info/Primary | `stone-900` | Primary buttons, active nav |

#### Category Badge Colors
| Category | Background | Text | Border |
|----------|------------|------|--------|
| OpEx | `bg-blue-50` | `text-blue-700` | `border-blue-200` |
| COGS | `bg-amber-50` | `text-amber-700` | `border-amber-200` |
| Marketing | `bg-purple-50` | `text-purple-700` | `border-purple-200` |

### 2.3 Typography

- **Font Family:** Geist Sans (variable: `--font-geist-sans`)
- **Monospace:** Geist Mono (variable: `--font-geist-mono`)
- **Heading Sizes:**
  - Page title: `text-2xl font-semibold`
  - Section title: `text-lg font-medium`
  - Card title: `text-base font-medium`

### 2.4 Component Styling

#### Buttons
- **Primary:** `bg-stone-900 text-white` with `rounded-md`
- **Secondary/Outline:** `border-stone-200` with hover state `hover:bg-stone-100`
- **Destructive:** `text-rose-600 hover:bg-rose-50`

#### Cards
- Base: `bg-white border border-stone-200 rounded-xl`
- Interactive: `hover:shadow-md transition-all`
- Alert state: Yellow border for low stock (`border-amber-300 bg-amber-50/50`)

#### Tables
- Header: `bg-transparent` with `text-stone-600` headers
- Rows: `hover:bg-stone-50` on hover
- Numeric columns: Right-aligned with `font-mono`

### 2.5 Spacing & Layout

- **Container:** `max-w-7xl mx-auto px-6`
- **Section spacing:** `space-y-8`
- **Card padding:** `p-4` to `p-6`
- **Grid gaps:** `gap-4`

---

## 3. Application Architecture

### 3.1 File Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with sidebar
│   ├── page.tsx                 # Dashboard (/)
│   ├── finance/
│   │   └── page.tsx             # Finance module (/finance)
│   ├── inventory/
│   │   └── page.tsx             # Products module (/inventory)
│   └── settings/
│       └── page.tsx             # Settings module (/settings)
│
├── components/
│   ├── ui/                      # ShadCN UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── calendar.tsx
│   │   ├── popover.tsx
│   │   ├── command.tsx
│   │   ├── badge.tsx
│   │   ├── separator.tsx
│   │   ├── tooltip.tsx
│   │   ├── label.tsx
│   │   └── sonner.tsx
│   │
│   ├── sidebar.tsx              # Main navigation sidebar
│   ├── providers.tsx            # React Query provider wrapper
│   │
│   ├── dashboard/
│   │   ├── kpi-cards.tsx        # KPI metric cards
│   │   └── recent-activity.tsx  # Activity feed
│   │
│   ├── finance/
│   │   ├── expense-form.tsx     # Add expense dialog
│   │   ├── expense-table.tsx    # Expense ledger table
│   │   ├── burn-chart.tsx       # Monthly burn bar chart
│   │   └── recurring-expenses.tsx # Recurring expense manager
│   │
│   └── inventory/
│       └── product-table.tsx    # Product catalog table
│
├── lib/
│   ├── supabase.ts              # Supabase client instance
│   ├── utils.ts                 # Utility functions (cn, etc.)
│   └── hooks/
│       ├── use-dashboard.ts     # Dashboard data hooks
│       ├── use-finance.ts       # Expense & vendor hooks
│       ├── use-products.ts      # Product CRUD hooks
│       └── use-recurring.ts     # Recurring expense hooks
│
└── types/
    └── supabase.ts              # TypeScript interfaces
```

### 3.2 Navigation Structure

#### Sidebar Navigation Items

| Label | Route | Icon | Status |
|-------|-------|------|--------|
| Dashboard | `/` | `LayoutDashboard` | Active |
| Finance | `/finance` | `Wallet` | Active |
| Products | `/inventory` | `Package` | Active |
| Settings | `/settings` | `Settings` | Active |
| Integrations | - | `Link` | Coming Soon (disabled) |
| Marketing | - | `Megaphone` | Coming Soon (disabled) |

### 3.3 Data Flow

```
User Action → React Component → TanStack Query Mutation
                                        ↓
                                  Supabase Client
                                        ↓
                                  PostgreSQL DB
                                        ↓
                              Query Invalidation
                                        ↓
                              UI Re-render with Fresh Data
```

---

## 4. Module: Dashboard

**Route:** `/` (root)
**File:** `src/app/page.tsx`

### 4.1 Purpose

The Dashboard provides an executive-level overview of business health with at-a-glance metrics and recent activity.

### 4.2 Components

#### 4.2.1 KPI Cards (`kpi-cards.tsx`)

Three metric cards displayed in a responsive grid:

| Card | Metric | Data Source | Visual |
|------|--------|-------------|--------|
| Cash Burn | Total expenses for current month | `expenses` table filtered by current month | Rose color, dollar format |
| Stock Alerts | Count of products below safety threshold | `components` table (legacy) | Amber if > 0, emerald if 0 |
| Runway | Placeholder for future implementation | Manual input | Gray placeholder text |

**Implementation Details:**
- Uses `useCurrentMonthBurn()` hook to calculate monthly total
- Uses `useLowStockCount()` hook for inventory alerts
- Date range: 1st of current month to last day of current month
- Updates in real-time when expenses are added

#### 4.2.2 Recent Activity (`recent-activity.tsx`)

Two-column layout showing:

**Recent Expenses Panel:**
- Displays last 5 expenses
- Shows: Vendor name, description, amount (red)
- Sorted by `created_at` descending

**Product Stock Panel:**
- Displays products with stock > 0
- Shows: Product name, current stock count
- Sorted alphabetically

### 4.3 Data Hooks

```typescript
// src/lib/hooks/use-dashboard.ts

useCurrentMonthBurn()    // Returns: number (total expenses this month)
useLowStockCount()       // Returns: number (count of low-stock items)
useRecentActivity()      // Returns: { expenses: [], products: [] }
```

---

## 5. Module: Finance

**Route:** `/finance`
**File:** `src/app/finance/page.tsx`

### 5.1 Purpose

Complete financial management including one-time expenses, recurring subscriptions, and visual burn analysis.

### 5.2 Components

#### 5.2.1 Expense Form (`expense-form.tsx`)

**Trigger:** "Add Expense" button in page header

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Date | Calendar picker | Yes | Date of expense |
| Amount | Number input | Yes | Dollar amount (prefix: $) |
| Vendor | Combobox | No | Select existing or create new |
| Category | Select | Yes | OpEx, COGS, or Marketing |
| Description | Text input | No | Free-text description |

**Vendor Combobox Features:**
- Search/filter existing vendors
- "Create new vendor" inline option
- Keyboard support (Enter to create)
- Auto-select after creation

**Form Behavior:**
- Validates required fields before submission
- Shows loading state during save
- Displays toast notification on success/error
- Resets form after successful save
- Closes dialog automatically

#### 5.2.2 Expense Table (`expense-table.tsx`)

**Display Format:** ShadCN Data Table

**Columns:**

| Column | Alignment | Format |
|--------|-----------|--------|
| Date | Left | "Jan 15, 2026" format |
| Vendor | Left | Vendor name or "-" |
| Description | Left | Truncated text or "-" |
| Category | Left | Colored badge |
| Amount | Right | Red text, "-$X,XXX.XX" format |

**Features:**
- **Filtering:** Dropdown to filter by category (All, OpEx, COGS, Marketing)
- **Pagination:** 10 rows per page with Previous/Next buttons
- **Empty State:** Centered message with receipt icon
- **Loading State:** Centered spinner

#### 5.2.3 Burn Chart (`burn-chart.tsx`)

**Library:** Recharts

**Chart Type:** Vertical Bar Chart

**Data:**
- Groups expenses by month
- Shows last 6 months of data
- X-axis: Month labels ("Jan '26" format)
- Y-axis: Dollar amounts with "$X,XXX" format

**Styling:**
- Bar color: Rose (`#e11d48`)
- Bar radius: Rounded top corners
- Grid: Dashed lines, stone color
- Tooltip: White background with shadow

#### 5.2.4 Recurring Expenses (`recurring-expenses.tsx`)

**Purpose:** Manage subscriptions, monthly fees, and annual payments

**Summary Section:**
- **Monthly Burn:** Sum of all monthly amounts + (annual amounts ÷ 12)
- **Annual Burn:** Sum of (monthly amounts × 12) + annual amounts
- Only includes active recurring rules

**Table Columns:**

| Column | Content |
|--------|---------|
| Service | Vendor name + description |
| Category | Colored badge (OpEx/COGS/Marketing) |
| Frequency | "Monthly" or "Annual" badge |
| Amount | Red dollar amount |
| Actions | Pause/Play, Edit, Delete buttons |

**Actions:**

1. **Add Recurring Expense**
   - Opens dialog with form
   - Fields: Vendor, Description, Amount, Frequency, Category
   - Supports creating new vendors inline

2. **Edit Recurring Expense**
   - Opens pre-filled dialog
   - All fields editable

3. **Pause/Resume**
   - Toggle `active` status
   - Paused items shown at 50% opacity
   - Excluded from burn totals

4. **Delete**
   - Confirmation dialog
   - Permanent deletion

### 5.3 Expense Categories

| Category | Full Name | Typical Use Cases |
|----------|-----------|-------------------|
| OpEx | Operating Expenses | Rent, utilities, software, salaries |
| COGS | Cost of Goods Sold | Raw materials, manufacturing, packaging |
| Marketing | Marketing | Ads, promotions, influencer payments |

### 5.4 Data Hooks

```typescript
// src/lib/hooks/use-finance.ts

useExpenses()           // Fetch all expenses with vendor join
useVendors()            // Fetch all vendors
useCreateVendor()       // Create new vendor
useCreateExpense()      // Create new expense
useMonthlyExpenses()    // Aggregated monthly totals for chart

// src/lib/hooks/use-recurring.ts

useRecurringRules()        // Fetch all recurring rules with vendor
useCreateRecurringRule()   // Create new recurring rule
useUpdateRecurringRule()   // Update existing rule
useToggleRecurringRule()   // Toggle active status
useDeleteRecurringRule()   // Delete rule
calculateRecurringTotals() // Utility to sum monthly/annual burn
```

---

## 6. Module: Products

**Route:** `/inventory`
**File:** `src/app/inventory/page.tsx`

### 6.1 Purpose

Centralized product catalog management with multi-tier pricing and inventory tracking.

### 6.2 Product Table (`product-table.tsx`)

**Display Format:** ShadCN Data Table

**Columns:**

| Column | Alignment | Content |
|--------|-----------|---------|
| Product | Left | Name + SKU (monospace) |
| Stock | Right | Clickable stock number |
| Cost | Right | Cost price (gray) |
| Retail | Right | Retail price (black) |
| Wholesale | Right | Wholesale price (gray) |
| Margin | Right | Percentage badge |
| Actions | Right | Context menu |

**Margin Calculation:**
```
Margin = ((Retail Price - Cost Price) / Retail Price) × 100
```

**Margin Badge Colors:**
| Range | Color |
|-------|-------|
| ≥ 50% | Emerald (excellent) |
| 30-49% | Amber (acceptable) |
| < 30% | Rose (low) |

### 6.3 Product Form

**Trigger:** "Add Product" button OR Edit action

**Form Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Product Name | Text | Yes | Display name |
| SKU | Text | No | Stock keeping unit code |
| Current Stock | Number | No | Default: 0 |
| Cost Price | Currency | No | Cost to produce/acquire |
| Retail Price | Currency | No | Standard selling price |
| Wholesale Price | Currency | No | Bulk/B2B price |

**Pricing Section:**
- Three-column grid layout
- Dollar sign prefix on inputs
- Accepts decimal values (0.01 precision)

### 6.4 Stock Management

**Trigger:** Click on stock number in table

**Dialog Options:**

| Operation | Description |
|-----------|-------------|
| Add | Increase stock by quantity |
| Remove | Decrease stock by quantity (minimum 0) |
| Set | Set exact stock level |

**Behavior:**
- Validates quantity is positive number
- Updates database immediately
- Shows toast confirmation
- Refreshes table data

### 6.5 Product Actions

**Context Menu (three-dot button):**

1. **Edit** - Opens product form with current values
2. **Delete** - Confirmation dialog, permanent deletion

### 6.6 Data Hooks

```typescript
// src/lib/hooks/use-products.ts

useProducts()         // Fetch all products, sorted by name
useCreateProduct()    // Create new product
useUpdateProduct()    // Update product fields
useUpdateStock()      // Modify stock (add/subtract/set)
useDeleteProduct()    // Delete product
```

---

## 7. Module: Settings

**Route:** `/settings`
**File:** `src/app/settings/page.tsx`

### 7.1 Current State

Placeholder page with "Coming Soon" message.

### 7.2 Planned Features

- Cash balance configuration (for runway calculation)
- User preferences
- Integration settings
- Data export/import

---

## 8. Database Schema

### 8.1 Tables Overview

| Table | Purpose |
|-------|---------|
| `vendors` | Supplier/service provider directory |
| `expenses` | One-time expense ledger |
| `recurring_rules` | Recurring expense definitions |
| `products` | Product catalog |
| `components` | Raw materials (legacy, unused) |
| `product_bom` | Bill of materials (legacy, unused) |

### 8.2 Table: vendors

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| name | TEXT | NOT NULL | Vendor display name |
| default_category | TEXT | nullable | Default expense category |
| website_url | TEXT | nullable | Vendor website |

### 8.3 Table: expenses

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| created_at | TIMESTAMPTZ | DEFAULT now() | Record creation time |
| date | DATE | NOT NULL | Expense date |
| description | TEXT | nullable | Free-text description |
| amount | NUMERIC | NOT NULL | Dollar amount |
| category | TEXT | NOT NULL | OpEx, COGS, or Marketing |
| vendor_id | UUID | FK → vendors(id) | Associated vendor |
| is_recurring | BOOLEAN | DEFAULT false | Legacy flag |
| receipt_url | TEXT | nullable | Receipt attachment URL |

### 8.4 Table: recurring_rules

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| vendor_id | UUID | FK → vendors(id) | Associated vendor |
| description | TEXT | nullable | Description of charge |
| amount | NUMERIC | NOT NULL | Dollar amount |
| category | TEXT | NOT NULL | OpEx, COGS, or Marketing |
| frequency | TEXT | NOT NULL | 'monthly' or 'yearly' |
| next_due_date | DATE | nullable | Next payment date |
| active | BOOLEAN | DEFAULT true | Is rule active? |
| created_at | TIMESTAMPTZ | DEFAULT now() | Record creation time |

### 8.5 Table: products

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique identifier |
| name | TEXT | NOT NULL | Product name |
| sku | TEXT | nullable | Stock keeping unit |
| current_stock | NUMERIC | DEFAULT 0 | Units in stock |
| cost_price | NUMERIC | nullable | Cost to produce/acquire |
| retail_price | NUMERIC | nullable | Standard retail price |
| wholesale_price | NUMERIC | nullable | Bulk/B2B price |
| sale_price | NUMERIC | nullable | Promotional price |
| sop_markdown | TEXT | nullable | Standard operating procedure |

### 8.6 Relationships

```
vendors (1) ←→ (N) expenses
vendors (1) ←→ (N) recurring_rules
```

---

## 9. Technical Implementation

### 9.1 State Management

**Server State:** TanStack Query (React Query v5)
- Automatic caching and invalidation
- Optimistic updates via `useMutation`
- Stale time: 60 seconds
- Refetch on window focus: disabled

**Client State:** React `useState` for local form/UI state

### 9.2 Data Fetching Pattern

```typescript
// Query (read)
const { data, isLoading, error } = useQuery({
  queryKey: ['resource-name'],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('table')
      .select('*');
    if (error) throw error;
    return data;
  },
});

// Mutation (write)
const mutation = useMutation({
  mutationFn: async (payload) => {
    const { error } = await supabase
      .from('table')
      .insert(payload);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource-name'] });
  },
});
```

### 9.3 Toast Notifications

**Library:** Sonner (via ShadCN)

**Usage:**
```typescript
import { toast } from 'sonner';

toast.success('Item saved successfully');
toast.error('Failed to save item');
```

### 9.4 Form Validation

- Client-side validation only
- Required fields checked before submission
- Numeric validation for amounts
- Toast error messages for invalid input

### 9.5 Error Handling

- Try/catch blocks around Supabase operations
- Generic error messages to users
- Errors thrown to React Query for retry logic

---

## 10. Future Roadmap

### 10.1 Planned Integrations (Coming Soon)

| Integration | Purpose |
|-------------|---------|
| Stripe | Payment processing, revenue tracking |
| QuickBooks | Accounting sync |
| Shopify | E-commerce order sync |
| Google Sheets | Data export/reporting |

### 10.2 Planned Marketing Module (Coming Soon)

- Campaign tracking
- Ad spend monitoring
- Customer acquisition cost (CAC) calculation
- Attribution modeling

### 10.3 Settings Enhancements

- Cash balance input for runway calculation
- Currency configuration
- Date format preferences
- Dark mode toggle
- Data export (CSV/JSON)

### 10.4 Authentication (If Needed)

- Supabase Auth integration
- Email/password login
- Role-based access control
- Audit logging

---

## Appendix A: Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |

---

## Appendix B: npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Start production server |
| `lint` | `eslint` | Run ESLint |

---

## Appendix C: Dependencies

### Production Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.1.4 | React framework |
| react | 19.2.3 | UI library |
| @supabase/supabase-js | ^2.91.0 | Database client |
| @tanstack/react-query | ^5.90.19 | Data fetching |
| recharts | ^2.x | Charts |
| lucide-react | ^0.562.0 | Icons |
| clsx | ^2.1.1 | Class utilities |
| tailwind-merge | ^3.4.0 | Tailwind class merging |

### ShadCN UI Components

button, card, dialog, input, select, table, sonner, calendar, popover, command, label, badge, separator, tooltip

---

*End of Documentation*
