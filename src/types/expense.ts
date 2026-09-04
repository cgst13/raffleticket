export type ExpenseCategory =
  | 'printing'
  | 'prizes'
  | 'marketing'
  | 'venue'
  | 'logistics'
  | 'commission'
  | 'other';

export interface Expense {
  id: string;
  raffleId: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  receiptNumber?: string;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string; color: string }[] = [
  { value: 'printing', label: 'Printing & Supplies', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'prizes', label: 'Prizes & Awards', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { value: 'marketing', label: 'Marketing & Ads', color: 'bg-pink-100 text-pink-800 border-pink-200' },
  { value: 'venue', label: 'Venue & Facilities', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { value: 'logistics', label: 'Logistics & Transport', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'commission', label: 'Solicitor Commission', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { value: 'other', label: 'Other Expenses', color: 'bg-neutral-100 text-neutral-800 border-neutral-200' },
];
