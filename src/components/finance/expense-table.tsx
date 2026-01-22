'use client';

import { useState } from 'react';
import {
  Receipt,
  MoreHorizontal,
  Pencil,
  Trash2,
  Check,
  ChevronsUpDown,
  Plus,
} from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useCreateVendor,
  useDeleteExpense,
  useExpenses,
  useUpdateExpense,
  useVendors,
} from '@/lib/hooks/use-finance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ExpenseCategory, ExpenseWithVendor } from '@/types/supabase';

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  OpEx: 'bg-blue-50 text-blue-700 border-blue-200',
  COGS: 'bg-amber-50 text-amber-700 border-amber-200',
  Marketing: 'bg-purple-50 text-purple-700 border-purple-200',
};

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'OpEx', label: 'Operating Expenses' },
  { value: 'COGS', label: 'Cost of Goods Sold' },
  { value: 'Marketing', label: 'Marketing' },
];

const PAGE_SIZE = 10;

export function ExpenseTable() {
  const { data: expenses, isLoading, error } = useExpenses();
  const { data: vendors } = useVendors();
  const createVendorMutation = useCreateVendor();
  const updateExpenseMutation = useUpdateExpense();
  const deleteExpenseMutation = useDeleteExpense();

  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | 'all'>(
    'all'
  );
  const [page, setPage] = useState(0);
  const [editingExpense, setEditingExpense] = useState<ExpenseWithVendor | null>(
    null
  );
  const [editDate, setEditDate] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editVendorId, setEditVendorId] = useState('');
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('OpEx');
  const [editDescription, setEditDescription] = useState('');

  const [vendorOpen, setVendorOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [showNewVendorInput, setShowNewVendorInput] = useState(false);

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

  const openEditDialog = (expense: ExpenseWithVendor) => {
    setEditingExpense(expense);
    setEditDate(expense.date);
    setEditAmount(expense.amount.toString());
    setEditVendorId(expense.vendor_id || '');
    setEditCategory(expense.category);
    setEditDescription(expense.description || '');
    setVendorOpen(false);
    setNewVendorName('');
    setShowNewVendorInput(false);
  };

  const handleCreateVendor = async () => {
    if (!newVendorName.trim()) return;

    try {
      const vendor = await createVendorMutation.mutateAsync({
        name: newVendorName.trim(),
      });
      setEditVendorId(vendor.id);
      setNewVendorName('');
      setShowNewVendorInput(false);
      setVendorOpen(false);
      toast.success(`Created vendor: ${vendor.name}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create vendor';
      toast.error(message);
    }
  };

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;
    if (!editDate || !editAmount || !editCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(editAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await updateExpenseMutation.mutateAsync({
        id: editingExpense.id,
        updates: {
          date: editDate,
          amount: amountNum,
          category: editCategory,
          vendor_id: editVendorId || null,
          description: editDescription.trim() ? editDescription.trim() : null,
        },
      });
      toast.success('Expense updated');
      setEditingExpense(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update expense';
      toast.error(message);
    }
  };

  const handleDeleteExpense = async (expense: ExpenseWithVendor) => {
    const label = expense.description || expense.vendors?.name || 'this expense';
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;

    try {
      await deleteExpenseMutation.mutateAsync(expense.id);
      toast.success('Expense deleted');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete expense';
      toast.error(message);
    }
  };

  const selectedVendor = vendors?.find((v) => v.id === editVendorId);

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
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-12"></TableHead>
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
                    -$
                    {expense.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-40">
                        <div className="grid gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start gap-2"
                            onClick={() => openEditDialog(expense)}
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="justify-start gap-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => handleDeleteExpense(expense)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
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

      {/* Edit Expense Dialog */}
      <Dialog
        open={!!editingExpense}
        onOpenChange={(open) => !open && setEditingExpense(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>Update this expense entry</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-expense-date">Date</Label>
              <Input
                id="edit-expense-date"
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-expense-amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
                  $
                </span>
                <Input
                  id="edit-expense-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Vendor</Label>
              <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={vendorOpen}
                    className="justify-between"
                  >
                    {selectedVendor?.name || 'Select vendor...'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search vendors..." />
                    <CommandList>
                      <CommandEmpty>No vendor found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__none__"
                          onSelect={() => {
                            setEditVendorId('');
                            setVendorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              !editVendorId ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          No vendor
                        </CommandItem>
                        {vendors?.map((vendor) => (
                          <CommandItem
                            key={vendor.id}
                            value={vendor.name}
                            onSelect={() => {
                              setEditVendorId(vendor.id);
                              setVendorOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                editVendorId === vendor.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {vendor.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      <CommandSeparator />
                      <CommandGroup>
                        {showNewVendorInput ? (
                          <div className="flex items-center gap-2 p-2">
                            <Input
                              placeholder="Vendor name"
                              value={newVendorName}
                              onChange={(e) => setNewVendorName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateVendor();
                                }
                              }}
                              className="h-8"
                            />
                            <Button
                              size="sm"
                              onClick={handleCreateVendor}
                              disabled={createVendorMutation.isPending}
                            >
                              Add
                            </Button>
                          </div>
                        ) : (
                          <CommandItem onSelect={() => setShowNewVendorInput(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create new vendor
                          </CommandItem>
                        )}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label>Category</Label>
              <Select
                value={editCategory}
                onValueChange={(v) => setEditCategory(v as ExpenseCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-expense-description">Description (optional)</Label>
              <Input
                id="edit-expense-description"
                placeholder="What was this expense for?"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingExpense(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateExpense}
              disabled={updateExpenseMutation.isPending}
            >
              {updateExpenseMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
