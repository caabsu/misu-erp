'use client';

import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useExpenses } from '@/lib/hooks/use-finance';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/types/supabase';

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  OpEx: 'bg-blue-50 text-blue-700 border-blue-200',
  COGS: 'bg-amber-50 text-amber-700 border-amber-200',
  Marketing: 'bg-purple-50 text-purple-700 border-purple-200',
};

const PAGE_SIZE = 10;

export function ExpenseTable() {
  const { data: expenses, isLoading, error } = useExpenses();
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>(
    'all'
  );
  const [page, setPage] = useState(0);

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
          Failed to load expenses. Please check your connection.
        </CardContent>
      </Card>
    );
  }

  if (!expenses || expenses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="mb-4 h-12 w-12 text-stone-300" />
          <p className="text-stone-600">No expenses recorded</p>
          <p className="text-sm text-stone-400">
            Add your first expense to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter expenses
  const filteredExpenses =
    categoryFilter === 'all'
      ? expenses
      : expenses.filter((e) => e.category === categoryFilter);

  // Paginate
  const totalPages = Math.ceil(filteredExpenses.length / PAGE_SIZE);
  const paginatedExpenses = filteredExpenses.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-500">Filter by:</span>
        <Select
          value={categoryFilter}
          onValueChange={(v) => {
            setCategoryFilter(v as ExpenseCategory | 'all');
            setPage(0);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="OpEx">OpEx</SelectItem>
            <SelectItem value="COGS">COGS</SelectItem>
            <SelectItem value="Marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedExpenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {new Date(expense.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>
                  {expense.vendors?.name || (
                    <span className="text-stone-400">-</span>
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate">
                  {expense.description || (
                    <span className="text-stone-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'font-normal',
                      CATEGORY_STYLES[expense.category]
                    )}
                  >
                    {expense.category}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-rose-600">
                  -${expense.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-stone-500">
            Showing {page * PAGE_SIZE + 1} -{' '}
            {Math.min((page + 1) * PAGE_SIZE, filteredExpenses.length)} of{' '}
            {filteredExpenses.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
