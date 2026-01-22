'use client';

import { useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Check,
  ChevronsUpDown,
  Pause,
  Play,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  useRecurringRules,
  useCreateRecurringRule,
  useUpdateRecurringRule,
  useToggleRecurringRule,
  useDeleteRecurringRule,
  calculateRecurringTotals,
} from '@/lib/hooks/use-recurring';
import { useVendors, useCreateVendor } from '@/lib/hooks/use-finance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { RecurringRuleInsert, RecurringRuleWithVendor, ExpenseCategory } from '@/types/supabase';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'OpEx', label: 'Operating Expenses' },
  { value: 'COGS', label: 'Cost of Goods Sold' },
  { value: 'Marketing', label: 'Marketing' },
];

const CATEGORY_STYLES: Record<ExpenseCategory, string> = {
  OpEx: 'bg-blue-50 text-blue-700 border-blue-200',
  COGS: 'bg-amber-50 text-amber-700 border-amber-200',
  Marketing: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function RecurringExpenses() {
  const { data: rules, isLoading, error } = useRecurringRules();
  const { data: vendors } = useVendors();
  const createMutation = useCreateRecurringRule();
  const updateMutation = useUpdateRecurringRule();
  const toggleMutation = useToggleRecurringRule();
  const deleteMutation = useDeleteRecurringRule();
  const createVendorMutation = useCreateVendor();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<RecurringRuleWithVendor | null>(null);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [showNewVendorInput, setShowNewVendorInput] = useState(false);

  const [formData, setFormData] = useState<RecurringRuleInsert>({
    vendor_id: null,
    description: '',
    amount: 0,
    category: 'OpEx',
    frequency: 'monthly',
    next_due_date: null,
  });

  const resetForm = () => {
    setFormData({
      vendor_id: null,
      description: '',
      amount: 0,
      category: 'OpEx',
      frequency: 'monthly',
      next_due_date: null,
    });
    setNewVendorName('');
    setShowNewVendorInput(false);
  };

  const openEditDialog = (rule: RecurringRuleWithVendor) => {
    setEditingRule(rule);
    setFormData({
      vendor_id: rule.vendor_id,
      description: rule.description || '',
      amount: rule.amount,
      category: rule.category,
      frequency: rule.frequency,
      next_due_date: rule.next_due_date,
    });
  };

  const handleCreateVendor = async () => {
    if (!newVendorName.trim()) return;
    try {
      const vendor = await createVendorMutation.mutateAsync({ name: newVendorName.trim() });
      setFormData({ ...formData, vendor_id: vendor.id });
      setNewVendorName('');
      setShowNewVendorInput(false);
      setVendorOpen(false);
      toast.success(`Created vendor: ${vendor.name}`);
    } catch {
      toast.error('Failed to create vendor');
    }
  };

  const handleSubmit = async () => {
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      if (editingRule) {
        await updateMutation.mutateAsync({ id: editingRule.id, updates: formData });
        toast.success('Recurring expense updated');
        setEditingRule(null);
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Recurring expense created');
        setShowAddDialog(false);
      }
      resetForm();
    } catch {
      toast.error('Failed to save recurring expense');
    }
  };

  const handleToggle = async (rule: RecurringRuleWithVendor) => {
    try {
      await toggleMutation.mutateAsync({ id: rule.id, active: !rule.active });
      toast.success(rule.active ? 'Expense paused' : 'Expense activated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (rule: RecurringRuleWithVendor) => {
    const name = rule.description || rule.vendors?.name || 'this expense';
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;

    try {
      await deleteMutation.mutateAsync(rule.id);
      toast.success('Recurring expense deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const totals = rules ? calculateRecurringTotals(rules) : { monthlyTotal: 0, annualTotal: 0 };
  const selectedVendor = vendors?.find((v) => v.id === formData.vendor_id);

  const ruleFormContent = (
    <div className="grid gap-4 py-4">
      {/* Vendor */}
      <div>
        <Label>Vendor / Service</Label>
        <Popover open={vendorOpen} onOpenChange={setVendorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="mt-1 w-full justify-between"
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
                  {vendors?.map((vendor) => (
                    <CommandItem
                      key={vendor.id}
                      value={vendor.name}
                      onSelect={() => {
                        setFormData((prev) => ({ ...prev, vendor_id: vendor.id }));
                        setVendorOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          formData.vendor_id === vendor.id ? 'opacity-100' : 'opacity-0'
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
                      <Button size="sm" onClick={handleCreateVendor}>
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

      {/* Description */}
      <div>
        <Label htmlFor="recurring-description">Description</Label>
        <Input
          id="recurring-description"
          placeholder="e.g., Monthly software subscription"
          value={formData.description || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Amount */}
        <div>
          <Label htmlFor="recurring-amount">Amount</Label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
            <Input
              id="recurring-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.amount || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))
              }
              className="pl-7"
            />
          </div>
        </div>

        {/* Frequency */}
        <div>
          <Label>Frequency</Label>
          <Select
            value={formData.frequency}
            onValueChange={(v) => setFormData((prev) => ({ ...prev, frequency: v as 'monthly' | 'yearly' }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Category */}
      <div>
        <Label>Category</Label>
        <Select
          value={formData.category}
          onValueChange={(v) => setFormData((prev) => ({ ...prev, category: v as ExpenseCategory }))}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
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
    </div>
  );

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
          Failed to load recurring expenses.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="h-4 w-4 text-stone-500" />
              Recurring Expenses
            </CardTitle>
            <p className="mt-1 text-sm text-stone-500">
              Subscriptions, fees, and regular payments
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          {/* Totals Summary */}
          <div className="mb-4 grid grid-cols-2 gap-4 rounded-lg bg-stone-50 p-4">
            <div>
              <p className="text-xs text-stone-500">Monthly Burn</p>
              <p className="text-xl font-semibold text-rose-600">
                ${totals.monthlyTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-xs text-stone-500">Annual Burn</p>
              <p className="text-xl font-semibold text-rose-600">
                ${totals.annualTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {!rules || rules.length === 0 ? (
            <div className="py-8 text-center text-stone-400">
              No recurring expenses yet
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className={cn(!rule.active && 'opacity-50')}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-stone-900">
                          {rule.vendors?.name || 'Unknown'}
                        </p>
                        {rule.description && (
                          <p className="text-xs text-stone-500">{rule.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-normal', CATEGORY_STYLES[rule.category])}>
                        {rule.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-stone-200 font-normal text-stone-600">
                        {rule.frequency === 'monthly' ? 'Monthly' : 'Annual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-rose-600">
                      ${rule.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleToggle(rule)}
                        >
                          {rule.active ? (
                            <Pause className="h-4 w-4 text-stone-500" />
                          ) : (
                            <Play className="h-4 w-4 text-emerald-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => openEditDialog(rule)}
                        >
                          <Pencil className="h-4 w-4 text-stone-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDelete(rule)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Recurring Expense</DialogTitle>
            <DialogDescription>
              Set up a monthly or annual recurring payment
            </DialogDescription>
          </DialogHeader>
          {ruleFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Adding...' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Recurring Expense</DialogTitle>
            <DialogDescription>Update recurring payment details</DialogDescription>
          </DialogHeader>
          {ruleFormContent}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRule(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
