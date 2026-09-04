import { Expense } from '../../types/expense';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

export interface ExpenseFilter {
  raffleId?: string;
  category?: string;
  search?: string;
}

export class LocalStorageExpensesRepository {
  getAll(filter?: ExpenseFilter): Expense[] {
    let list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    if (!filter) return list;

    if (filter.raffleId) {
      list = list.filter((e) => e.raffleId === filter.raffleId);
    }

    if (filter.category && filter.category !== 'all') {
      list = list.filter((e) => e.category === filter.category);
    }

    if (filter.search && filter.search.trim()) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.receiptNumber && e.receiptNumber.toLowerCase().includes(q)) ||
          (e.notes && e.notes.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getById(id: string): Expense | null {
    const list = this.getAll();
    return list.find((e) => e.id === id) || null;
  }

  create(expense: Expense): Expense {
    const list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    list.unshift(expense);
    storageAdapter.set(STORAGE_KEYS.EXPENSES, list);

    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase.from('expenses').upsert(
          {
            id: expense.id,
            raffle_id: expense.raffleId,
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            date: expense.date,
            receipt_number: expense.receiptNumber || null,
            notes: expense.notes || '',
            recorded_by: expense.recordedBy || null,
            created_at: expense.createdAt,
            updated_at: expense.updatedAt,
          },
          { onConflict: 'id' }
        )
      )
        .then((res: any) => {
          if (res?.error) console.error('Supabase expense create error:', res.error);
        })
        .catch((err) => console.error('Supabase expense create error:', err));
    }

    return expense;
  }

  update(id: string, updates: Partial<Expense>): Expense | null {
    const list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const index = list.findIndex((e) => e.id === id);
    if (index === -1) return null;

    const updated = {
      ...list[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    storageAdapter.set(STORAGE_KEYS.EXPENSES, list);

    if (isSupabaseConfigured()) {
      const payload: any = {
        updated_at: updated.updatedAt,
      };
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.amount !== undefined) payload.amount = updates.amount;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.date !== undefined) payload.date = updates.date;
      if (updates.receiptNumber !== undefined) payload.receipt_number = updates.receiptNumber || null;
      if (updates.notes !== undefined) payload.notes = updates.notes || '';
      if (updates.recordedBy !== undefined) payload.recorded_by = updates.recordedBy || null;

      Promise.resolve(supabase.from('expenses').update(payload).eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase expense update error:', res.error);
        })
        .catch((err) => console.error('Supabase expense update error:', err));
    }

    return updated;
  }

  delete(id: string): boolean {
    const list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const filtered = list.filter((e) => e.id !== id);
    if (filtered.length === list.length) return false;
    storageAdapter.set(STORAGE_KEYS.EXPENSES, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('expenses').delete().eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase expense delete error:', res.error);
        })
        .catch((err) => console.error('Supabase expense delete error:', err));
    }

    return true;
  }

  deleteByRaffleId(raffleId: string): number {
    const list = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
    const filtered = list.filter((e) => e.raffleId !== raffleId);
    const deletedCount = list.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.EXPENSES, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('expenses').delete().eq('raffle_id', raffleId))
        .then((res: any) => {
          if (res?.error) console.error('Supabase expenses deleteByRaffle error:', res.error);
        })
        .catch((err) => console.error('Supabase expenses deleteByRaffle error:', err));
    }

    return deletedCount;
  }
}

export const expensesRepository = new LocalStorageExpensesRepository();

