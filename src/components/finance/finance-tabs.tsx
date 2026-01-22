'use client';

import { useMemo, useState } from 'react';
import { ExpenseForm } from '@/components/finance/expense-form';
import { ExpenseTable } from '@/components/finance/expense-table';
import { BurnChart } from '@/components/finance/burn-chart';
import { RecurringExpenses } from '@/components/finance/recurring-expenses';
import { SpendCompositionChart } from '@/components/finance/spend-composition-chart';
import { VendorConcentration } from '@/components/finance/vendor-concentration';
import { MonthlyComparison } from '@/components/finance/monthly-comparison';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function FinanceTabs() {
  const [activeTab, setActiveTab] = useState<'transactions' | 'analytics'>(
    'transactions'
  );
  const currentRange = useMemo(() => getCurrentMonthRange(), []);
  const [startDate, setStartDate] = useState(currentRange.start);
  const [endDate, setEndDate] = useState(currentRange.end);

  const rangeLabel =
    startDate === currentRange.start && endDate === currentRange.end
      ? 'this month'
      : 'this period';

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Finance</h1>
          <p className="text-stone-500">
            Track expenses, subscriptions, and monitor cash burn
          </p>
        </div>
        {activeTab === 'transactions' && <ExpenseForm />}
      </div>

      <div className="flex w-fit items-center rounded-lg border border-stone-200 bg-white p-1 text-sm">
        {['transactions', 'analytics'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'transactions' | 'analytics')}
            className={cn(
              'rounded-md px-3 py-1.5 font-medium transition-colors',
              activeTab === tab
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            )}
          >
            {tab === 'transactions' ? 'Transactions' : 'Analytics'}
          </button>
        ))}
      </div>

      {activeTab === 'transactions' ? (
        <>
          <BurnChart />
          <RecurringExpenses />
          <Separator />
          <section>
            <h2 className="mb-4 text-lg font-medium text-stone-800">
              Expense Ledger
            </h2>
            <ExpenseTable />
          </section>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-medium text-stone-800">
                Analytics Overview
              </h2>
              <p className="text-sm text-stone-500">
                Review spend composition and vendor concentration
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div>
                <Label htmlFor="analytics-start" className="text-xs text-stone-500">
                  Start Date
                </Label>
                <Input
                  id="analytics-start"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="analytics-end" className="text-xs text-stone-500">
                  End Date
                </Label>
                <Input
                  id="analytics-end"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <SpendCompositionChart
              startDate={startDate}
              endDate={endDate}
              rangeLabel={rangeLabel}
            />
            <VendorConcentration startDate={startDate} endDate={endDate} />
          </div>

          <MonthlyComparison />
        </>
      )}
    </div>
  );
}
