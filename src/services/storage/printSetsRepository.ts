import { IPrintSetRepository } from './interfaces';
import { PrintSet } from '../../types/printSet';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

export class LocalStoragePrintSetRepository implements IPrintSetRepository {
  getAll(filter?: { raffleId?: string }): PrintSet[] {
    let sets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
    if (filter?.raffleId) {
      sets = sets.filter((s) => s.raffleId === filter.raffleId);
    }
    // Sort descending by setNumber
    return sets.sort((a, b) => b.setNumber - a.setNumber);
  }

  getById(id: string): PrintSet | null {
    const sets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
    return sets.find((s) => s.id === id) || null;
  }

  create(printSet: PrintSet): PrintSet {
    const sets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
    sets.push(printSet);
    storageAdapter.set(STORAGE_KEYS.PRINT_SETS, sets);

    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase.from('print_sets').upsert(
          {
            id: printSet.id,
            raffle_id: printSet.raffleId,
            set_number: printSet.setNumber,
            starting_ticket_number: printSet.startingTicketNumber,
            ending_ticket_number: printSet.endingTicketNumber,
            starting_sequence: printSet.startingSequence,
            ending_sequence: printSet.endingSequence,
            tickets_per_booklet: printSet.ticketsPerBooklet,
            total_booklets: printSet.totalBooklets,
            total_tickets: printSet.totalTickets,
            total_pages: printSet.totalPages,
            booklets_per_row: printSet.bookletsPerRow,
            status: printSet.status,
            created_at: printSet.createdAt,
          },
          { onConflict: 'id' }
        )
      )
        .then((res: any) => {
          if (res?.error) console.error('Supabase print_set create error:', res.error);
        })
        .catch((err) => console.error('Supabase print_set create error:', err));
    }

    return printSet;
  }

  update(id: string, updates: Partial<PrintSet>): PrintSet | null {
    const sets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
    const index = sets.findIndex((s) => s.id === id);
    if (index === -1) return null;

    sets[index] = { ...sets[index], ...updates };
    storageAdapter.set(STORAGE_KEYS.PRINT_SETS, sets);

    if (isSupabaseConfigured()) {
      const payload: any = {};
      if (updates.status !== undefined) payload.status = updates.status;

      Promise.resolve(supabase.from('print_sets').update(payload).eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase print_set update error:', res.error);
        })
        .catch((err) => console.error('Supabase print_set update error:', err));
    }

    return sets[index];
  }

  delete(id: string): boolean {
    const sets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
    const filtered = sets.filter((s) => s.id !== id);
    if (filtered.length === sets.length) return false;
    storageAdapter.set(STORAGE_KEYS.PRINT_SETS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('print_sets').delete().eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase print_set delete error:', res.error);
        })
        .catch((err) => console.error('Supabase print_set delete error:', err));
    }

    return true;
  }

  deleteByRaffleId(raffleId: string): number {
    const sets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
    const filtered = sets.filter((s) => s.raffleId !== raffleId);
    const count = sets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.PRINT_SETS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('print_sets').delete().eq('raffle_id', raffleId))
        .then((res: any) => {
          if (res?.error) console.error('Supabase print_set deleteByRaffle error:', res.error);
        })
        .catch((err) => console.error('Supabase print_set deleteByRaffle error:', err));
    }

    return count;
  }

  getNextSetNumber(raffleId: string): number {
    const sets = this.getAll({ raffleId });
    if (sets.length === 0) return 1;
    const max = Math.max(...sets.map((s) => s.setNumber));
    return max + 1;
  }
}

export const printSetsRepository = new LocalStoragePrintSetRepository();

