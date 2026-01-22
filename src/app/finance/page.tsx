import { ExpenseForm } from '@/components/finance/expense-form';
import { ExpenseTable } from '@/components/finance/expense-table';
import { BurnChart } from '@/components/finance/burn-chart';
import { RecurringExpenses } from '@/components/finance/recurring-expenses';
import { Separator } from '@/components/ui/separator';

export default function FinancePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Finance</h1>
          <p className="text-stone-500">Track expenses, subscriptions, and monitor cash burn</p>
        </div>
        <ExpenseForm />
      </div>

      {/* Burn Chart */}
      <BurnChart />

      {/* Recurring Expenses */}
      <RecurringExpenses />

      <Separator />

      {/* Expense Table */}
      <section>
        <h2 className="mb-4 text-lg font-medium text-stone-800">
          Expense Ledger
        </h2>
        <ExpenseTable />
      </section>
    </div>
  );
}
