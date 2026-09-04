import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../../types/expense';
import { Raffle } from '../../types/raffle';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input, Select } from '../ui/Input';
import { expensesRepository } from '../../services/storage/expensesRepository';
import { useToast } from '../../context/ToastContext';
import { Receipt, DollarSign, Calendar, Tag, FileText } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface ExpenseModalProps {
  expense: Expense | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  defaultRaffleId?: string;
  raffles: Raffle[];
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  expense,
  isOpen,
  onClose,
  onSaved,
  defaultRaffleId,
  raffles,
}) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('printing');
  const [raffleId, setRaffleId] = useState('');
  const [date, setDate] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [notes, setNotes] = useState('');
  const toast = useToast();

  useEffect(() => {
    if (expense) {
      setTitle(expense.title);
      setAmount(String(expense.amount));
      setCategory(expense.category);
      setRaffleId(expense.raffleId);
      setDate(expense.date ? expense.date.split('T')[0] : '');
      setReceiptNumber(expense.receiptNumber || '');
      setNotes(expense.notes || '');
    } else {
      setTitle('');
      setAmount('');
      setCategory('printing');
      setRaffleId(defaultRaffleId && defaultRaffleId !== 'all' ? defaultRaffleId : (raffles[0]?.id || ''));
      setDate(new Date().toISOString().split('T')[0]);
      setReceiptNumber('');
      setNotes('');
    }
  }, [expense, isOpen, defaultRaffleId, raffles]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Expense Title / Description is required.');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!raffleId) {
      toast.error('Please select an event for this expense.');
      return;
    }

    const now = new Date().toISOString();

    if (expense) {
      expensesRepository.update(expense.id, {
        title: title.trim(),
        amount: numAmount,
        category,
        raffleId,
        date: date || now.split('T')[0],
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success(`Expense "${title.trim()}" updated successfully!`);
    } else {
      const newExpense: Expense = {
        id: uuidv4(),
        title: title.trim(),
        amount: numAmount,
        category,
        raffleId,
        date: date || now.split('T')[0],
        receiptNumber: receiptNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: now,
        updatedAt: now,
      };
      expensesRepository.create(newExpense);
      toast.success(`Expense "${title.trim()}" added to financial records!`);
    }

    onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-[#F97316]" />
          <span>{expense ? 'Edit Expense Record' : 'Record New Expense'}</span>
        </div>
      }
      description="Add costs and outflows associated with this raffle event to calculate accurate net profit."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Expense Title / Description *"
          placeholder="e.g. Printing paper & ink, venue security, prize purchase"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Amount ($) *"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            leftAddon={<DollarSign className="w-4 h-4 text-neutral-400" />}
            required
          />

          <Select
            label="Expense Category *"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            options={EXPENSE_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Associated Event *"
            value={raffleId}
            onChange={(e) => setRaffleId(e.target.value)}
            options={raffles.map((r) => ({ value: r.id, label: r.raffleName }))}
            required
          />

          <Input
            label="Date of Expense *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            leftAddon={<Calendar className="w-4 h-4 text-neutral-400" />}
            required
          />
        </div>

        <Input
          label="Receipt / Invoice / Reference #"
          placeholder="e.g. INV-2026-0045"
          value={receiptNumber}
          onChange={(e) => setReceiptNumber(e.target.value)}
          leftAddon={<Tag className="w-4 h-4 text-neutral-400" />}
          helperText="Optional reference or invoice identifier."
        />

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
            Additional Notes
          </label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all"
            placeholder="Notes on vendor, approval, payment method, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            className="bg-[#F97316] hover:bg-[#EA580C]"
            leftIcon={<Receipt className="w-4 h-4" />}
          >
            {expense ? 'Update Expense' : 'Save Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
