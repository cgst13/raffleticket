import { ITicketRepository } from './interfaces';
import { Ticket, TicketStatus } from '../../types/ticket';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

export class LocalStorageTicketRepository implements ITicketRepository {
  getAll(filter?: { raffleId?: string; printSetId?: string; bookletId?: string; status?: TicketStatus }): Ticket[] {
    let tickets = storageAdapter.get<Ticket[]>(STORAGE_KEYS.TICKETS, []);

    if (filter) {
      if (filter.raffleId) {
        tickets = tickets.filter((t) => t.raffleId === filter.raffleId);
      }
      if (filter.printSetId) {
        tickets = tickets.filter((t) => t.printSetId === filter.printSetId);
      }
      if (filter.bookletId) {
        tickets = tickets.filter((t) => t.bookletId === filter.bookletId);
      }
      if (filter.status) {
        tickets = tickets.filter((t) => t.status === filter.status);
      }
    }

    return tickets;
  }

  getById(id: string): Ticket | null {
    const tickets = this.getAll();
    return tickets.find((t) => t.id === id) || null;
  }

  getBySequence(raffleId: string, sequence: number): Ticket | null {
    const tickets = this.getAll({ raffleId });
    return tickets.find((t) => t.ticketSequence === sequence) || null;
  }

  getByTicketNumber(raffleId: string, ticketNumber: string): Ticket | null {
    const tickets = this.getAll({ raffleId });
    return tickets.find((t) => t.ticketNumber.toLowerCase() === ticketNumber.toLowerCase()) || null;
  }

  getByQrUuid(uuid: string): Ticket | null {
    const tickets = this.getAll();
    return tickets.find((t) => t.id === uuid || t.qrValue.includes(uuid)) || null;
  }

  create(ticket: Ticket): Ticket {
    const tickets = this.getAll();
    tickets.push(ticket);
    storageAdapter.set(STORAGE_KEYS.TICKETS, tickets);

    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase.from('tickets').upsert(
          {
            id: ticket.id,
            print_set_id: ticket.printSetId,
            booklet_id: ticket.bookletId,
            raffle_id: ticket.raffleId,
            ticket_number: ticket.ticketNumber,
            ticket_sequence: ticket.ticketSequence,
            qr_value: ticket.qrValue,
            amount: ticket.amount,
            status: ticket.status,
            buyer_name: ticket.buyerName || null,
            solicitor_name: ticket.solicitorName || null,
            created_at: ticket.createdAt,
            assigned_at: ticket.assignedAt || null,
            sold_at: ticket.soldAt || null,
            used_at: ticket.usedAt || null,
          },
          { onConflict: 'id' }
        )
      )
        .then((res: any) => {
          if (res?.error) console.error('Supabase ticket create error:', res.error);
        })
        .catch((err) => console.error('Supabase ticket create error:', err));
    }

    return ticket;
  }

  createMany(newTickets: Ticket[]): Ticket[] {
    const tickets = this.getAll();
    tickets.push(...newTickets);
    storageAdapter.set(STORAGE_KEYS.TICKETS, tickets);

    if (isSupabaseConfigured() && newTickets.length > 0) {
      const payload = newTickets.map((t) => ({
        id: t.id,
        print_set_id: t.printSetId,
        booklet_id: t.bookletId,
        raffle_id: t.raffleId,
        ticket_number: t.ticketNumber,
        ticket_sequence: t.ticketSequence,
        qr_value: t.qrValue,
        amount: t.amount,
        status: t.status,
        buyer_name: t.buyerName || null,
        solicitor_name: t.solicitorName || null,
        created_at: t.createdAt,
        assigned_at: t.assignedAt || null,
        sold_at: t.soldAt || null,
        used_at: t.usedAt || null,
      }));

      for (let i = 0; i < payload.length; i += 500) {
        const chunk = payload.slice(i, i + 500);
        Promise.resolve(supabase.from('tickets').upsert(chunk, { onConflict: 'id' }))
          .then((res: any) => {
            if (res?.error) console.error('Supabase tickets chunk error:', res.error);
          })
          .catch((err) => console.error('Supabase tickets chunk error:', err));
      }
    }

    return newTickets;
  }

  update(id: string, updates: Partial<Ticket>): Ticket | null {
    const tickets = this.getAll();
    const index = tickets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    tickets[index] = { ...tickets[index], ...updates };
    storageAdapter.set(STORAGE_KEYS.TICKETS, tickets);

    if (isSupabaseConfigured()) {
      const payload: any = {};
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.buyerName !== undefined) payload.buyer_name = updates.buyerName || null;
      if (updates.solicitorName !== undefined) payload.solicitor_name = updates.solicitorName || null;
      if (updates.assignedAt !== undefined) payload.assigned_at = updates.assignedAt || null;
      if (updates.soldAt !== undefined) payload.sold_at = updates.soldAt || null;
      if (updates.usedAt !== undefined) payload.used_at = updates.usedAt || null;

      Promise.resolve(supabase.from('tickets').update(payload).eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase ticket update error:', res.error);
        })
        .catch((err) => console.error('Supabase ticket update error:', err));
    }

    return tickets[index];
  }

  updateMany(ids: string[], updates: Partial<Ticket>): number {
    const idSet = new Set(ids);
    const tickets = this.getAll();
    let count = 0;

    for (let i = 0; i < tickets.length; i++) {
      if (idSet.has(tickets[i].id)) {
        tickets[i] = { ...tickets[i], ...updates };
        count++;
      }
    }

    if (count > 0) {
      storageAdapter.set(STORAGE_KEYS.TICKETS, tickets);

      if (isSupabaseConfigured()) {
        const payload: any = {};
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.buyerName !== undefined) payload.buyer_name = updates.buyerName || null;
        if (updates.solicitorName !== undefined) payload.solicitor_name = updates.solicitorName || null;
        if (updates.assignedAt !== undefined) payload.assigned_at = updates.assignedAt || null;
        if (updates.soldAt !== undefined) payload.sold_at = updates.soldAt || null;
        if (updates.usedAt !== undefined) payload.used_at = updates.usedAt || null;

        for (let i = 0; i < ids.length; i += 200) {
          const chunkIds = ids.slice(i, i + 200);
          Promise.resolve(supabase.from('tickets').update(payload).in('id', chunkIds))
            .then((res: any) => {
              if (res?.error) console.error('Supabase updateMany tickets error:', res.error);
            })
            .catch((err) => console.error('Supabase updateMany tickets error:', err));
        }
      }
    }
    return count;
  }

  delete(id: string): boolean {
    const tickets = this.getAll();
    const filtered = tickets.filter((t) => t.id !== id);
    if (filtered.length === tickets.length) return false;
    storageAdapter.set(STORAGE_KEYS.TICKETS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('tickets').delete().eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase ticket delete error:', res.error);
        })
        .catch((err) => console.error('Supabase ticket delete error:', err));
    }

    return true;
  }

  deleteByRaffleId(raffleId: string): number {
    const tickets = this.getAll();
    const filtered = tickets.filter((t) => t.raffleId !== raffleId);
    const deletedCount = tickets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.TICKETS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('tickets').delete().eq('raffle_id', raffleId))
        .then((res: any) => {
          if (res?.error) console.error('Supabase tickets deleteByRaffle error:', res.error);
        })
        .catch((err) => console.error('Supabase tickets deleteByRaffle error:', err));
    }

    return deletedCount;
  }

  deleteByPrintSetId(printSetId: string): number {
    const tickets = this.getAll();
    const filtered = tickets.filter((t) => t.printSetId !== printSetId);
    const deletedCount = tickets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.TICKETS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('tickets').delete().eq('print_set_id', printSetId))
        .then((res: any) => {
          if (res?.error) console.error('Supabase tickets deleteByPrintSet error:', res.error);
        })
        .catch((err) => console.error('Supabase tickets deleteByPrintSet error:', err));
    }

    return deletedCount;
  }

  search(raffleId: string, query: string): Ticket[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll({ raffleId });

    return this.getAll({ raffleId }).filter((t) => {
      return (
        t.ticketNumber.toLowerCase().includes(q) ||
        (t.buyerName && t.buyerName.toLowerCase().includes(q)) ||
        (t.solicitorName && t.solicitorName.toLowerCase().includes(q)) ||
        t.id.toLowerCase().includes(q)
      );
    });
  }

  exists(raffleId: string, sequence: number): boolean {
    const tickets = this.getAll({ raffleId });
    return tickets.some((t) => t.ticketSequence === sequence);
  }

  getHighestSequence(raffleId: string): number {
    const tickets = this.getAll({ raffleId });
    if (tickets.length === 0) return 0;
    return Math.max(...tickets.map((t) => t.ticketSequence));
  }
}

export const ticketsRepository = new LocalStorageTicketRepository();

