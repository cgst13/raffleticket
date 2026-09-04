import { IBookletRepository } from './interfaces';
import { Booklet } from '../../types/booklet';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

export class LocalStorageBookletRepository implements IBookletRepository {
  getAll(filter?: { raffleId?: string; printSetId?: string }): Booklet[] {
    let booklets = storageAdapter.get<Booklet[]>(STORAGE_KEYS.BOOKLETS, []);

    if (filter) {
      if (filter.raffleId) {
        booklets = booklets.filter((b) => b.raffleId === filter.raffleId);
      }
      if (filter.printSetId) {
        booklets = booklets.filter((b) => b.printSetId === filter.printSetId);
      }
    }

    return booklets;
  }

  getById(id: string): Booklet | null {
    const booklets = this.getAll();
    return booklets.find((b) => b.id === id) || null;
  }

  create(booklet: Booklet): Booklet {
    const booklets = this.getAll();
    booklets.push(booklet);
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, booklets);

    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase.from('booklets').upsert(
          {
            id: booklet.id,
            print_set_id: booklet.printSetId,
            raffle_id: booklet.raffleId,
            booklet_number: booklet.bookletNumber,
            starting_ticket_number: booklet.startTicketNumber,
            ending_ticket_number: booklet.endTicketNumber,
            starting_sequence: booklet.startSequence,
            ending_sequence: booklet.endSequence,
            total_tickets: booklet.totalTickets,
            status: booklet.status,
            solicitor_name: booklet.solicitorName || null,
            buyer_name: booklet.buyerName || null,
            created_at: booklet.createdAt,
          },
          { onConflict: 'id' }
        )
      )
        .then((res: any) => {
          if (res?.error) console.error('Supabase booklet create error:', res.error);
        })
        .catch((err) => console.error('Supabase booklet create error:', err));
    }

    return booklet;
  }

  createMany(newBooklets: Booklet[]): Booklet[] {
    const booklets = this.getAll();
    booklets.push(...newBooklets);
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, booklets);

    if (isSupabaseConfigured() && newBooklets.length > 0) {
      const payload = newBooklets.map((b) => ({
        id: b.id,
        print_set_id: b.printSetId,
        raffle_id: b.raffleId,
        booklet_number: b.bookletNumber,
        starting_ticket_number: b.startTicketNumber,
        ending_ticket_number: b.endTicketNumber,
        starting_sequence: b.startSequence,
        ending_sequence: b.endSequence,
        total_tickets: b.totalTickets,
        status: b.status,
        solicitor_name: b.solicitorName || null,
        buyer_name: b.buyerName || null,
        created_at: b.createdAt,
      }));

      for (let i = 0; i < payload.length; i += 500) {
        const chunk = payload.slice(i, i + 500);
        Promise.resolve(supabase.from('booklets').upsert(chunk, { onConflict: 'id' }))
          .then((res: any) => {
            if (res?.error) console.error('Supabase booklets chunk error:', res.error);
          })
          .catch((err) => console.error('Supabase booklets chunk error:', err));
      }
    }

    return newBooklets;
  }

  update(id: string, updates: Partial<Booklet>): Booklet | null {
    const booklets = this.getAll();
    const index = booklets.findIndex((b) => b.id === id);
    if (index === -1) return null;

    booklets[index] = { ...booklets[index], ...updates };
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, booklets);

    if (isSupabaseConfigured()) {
      const payload: any = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.solicitorName !== undefined) payload.solicitor_name = updates.solicitorName || null;
      if (updates.buyerName !== undefined) payload.buyer_name = updates.buyerName || null;

      Promise.resolve(supabase.from('booklets').update(payload).eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase booklet update error:', res.error);
        })
        .catch((err) => console.error('Supabase booklet update error:', err));
    }

    return booklets[index];
  }

  delete(id: string): boolean {
    const booklets = this.getAll();
    const filtered = booklets.filter((b) => b.id !== id);
    if (filtered.length === booklets.length) return false;
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('booklets').delete().eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase booklet delete error:', res.error);
        })
        .catch((err) => console.error('Supabase booklet delete error:', err));
    }

    return true;
  }

  deleteByRaffleId(raffleId: string): number {
    const booklets = this.getAll();
    const filtered = booklets.filter((b) => b.raffleId !== raffleId);
    const count = booklets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('booklets').delete().eq('raffle_id', raffleId))
        .then((res: any) => {
          if (res?.error) console.error('Supabase booklets deleteByRaffle error:', res.error);
        })
        .catch((err) => console.error('Supabase booklets deleteByRaffle error:', err));
    }

    return count;
  }

  deleteByPrintSetId(printSetId: string): number {
    const booklets = this.getAll();
    const filtered = booklets.filter((b) => b.printSetId !== printSetId);
    const count = booklets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('booklets').delete().eq('print_set_id', printSetId))
        .then((res: any) => {
          if (res?.error) console.error('Supabase booklets deleteByPrintSet error:', res.error);
        })
        .catch((err) => console.error('Supabase booklets deleteByPrintSet error:', err));
    }

    return count;
  }
}

export const bookletsRepository = new LocalStorageBookletRepository();

