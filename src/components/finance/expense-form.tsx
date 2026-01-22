'use client';

import { useState } from 'react';
import { Plus, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar } from '@/components/ui/calendar';
import {
  useVendors,
  useCreateVendor,
  useCreateExpense,
} from '@/lib/hooks/use-finance';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ExpenseCategory } from '@/types/supabase';

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'OpEx', label: 'Operating Expenses' },
  { value: 'COGS', label: 'Cost of Goods Sold' },
  { value: 'Marketing', label: 'Marketing' },
];

export function ExpenseForm() {
  const [open, setOpen] = useState(false);
  const [vendorOpen, setVendorOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [newVendorName, setNewVendorName] = useState('');
  const [showNewVendorInput, setShowNewVendorInput] = useState(false);

  // Form state
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [amount, setAmount] = useState('');
  const [vendorId, setVendorId] = useState('');
  const [category, setCategory] = useState<ExpenseCategory | ''>('');
  const [description, setDescription] = useState('');

  const { data: vendors } = useVendors();
  const createVendorMutation = useCreateVendor();
  const createExpenseMutation = useCreateExpense();

  const resetForm = () => {
    setDate(new Date());
    setAmount('');
    setVendorId('');
    setCategory('');
    setDescription('');
    setNewVendorName('');
    setShowNewVendorInput(false);
  };

  const handleCreateNewVendor = async () => {
    if (!newVendorName.trim()) return;

    try {
      const vendor = await createVendorMutation.mutateAsync({
        name: newVendorName.trim(),
      });
      setVendorId(vendor.id);
      setNewVendorName('');
      setShowNewVendorInput(false);
      setVendorOpen(false);
      toast.success(`Created vendor: ${vendor.name}`);
    } catch {
      toast.error('Failed to create vendor');
    }
  };

  const handleSubmit = async () => {
    if (!date || !amount || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      await createExpenseMutation.mutateAsync({
        date: date.toISOString().split('T')[0],
        amount: amountNum,
        category: category as ExpenseCategory,
        vendor_id: vendorId || null,
        description: description || null,
      });
      toast.success('Expense saved');
      resetForm();
      setOpen(false);
    } catch {
      toast.error('Failed to save expense');
    }
  };

  const selectedVendor = vendors?.find((v) => v.id === vendorId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Record a new expense entry</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Date */}
          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !date && 'text-muted-foreground'
                  )}
                >
                  {date ? date.toLocaleDateString() : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Amount */}
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500">
                $
              </span>
              <Input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7"
              />
            </div>
          </div>

          {/* Vendor */}
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
                      {vendors?.map((vendor) => (
                        <CommandItem
                          key={vendor.id}
                          value={vendor.name}
                          onSelect={() => {
                            setVendorId(vendor.id);
                            setVendorOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              vendorId === vendor.id
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
                                handleCreateNewVendor();
                              }
                            }}
                            className="h-8"
                          />
                          <Button
                            size="sm"
                            onClick={handleCreateNewVendor}
                            disabled={createVendorMutation.isPending}
                          >
                            Add
                          </Button>
                        </div>
                      ) : (
                        <CommandItem
                          onSelect={() => setShowNewVendorInput(true)}
                        >
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

          {/* Category */}
          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as ExpenseCategory)}
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

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              placeholder="What was this expense for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createExpenseMutation.isPending}
          >
            {createExpenseMutation.isPending ? 'Saving...' : 'Save Expense'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
