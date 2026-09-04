import { ITicketRepository } from './interfaces';
import { Ticket, TicketStatus } from '../../types/ticket';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';

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
    return ticket;
  }

  createMany(newTickets: Ticket[]): Ticket[] {
    const tickets = this.getAll();
    tickets.push(...newTickets);
    storageAdapter.set(STORAGE_KEYS.TICKETS, tickets);
    return newTickets;
  }

  update(id: string, updates: Partial<Ticket>): Ticket | null {
    const tickets = this.getAll();
    const index = tickets.findIndex((t) => t.id === id);
    if (index === -1) return null;

    tickets[index] = { ...tickets[index], ...updates };
    storageAdapter.set(STORAGE_KEYS.TICKETS, tickets);
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
    }
    return count;
  }

  delete(id: string): boolean {
    const tickets = this.getAll();
    const filtered = tickets.filter((t) => t.id !== id);
    if (filtered.length === tickets.length) return false;
    storageAdapter.set(STORAGE_KEYS.TICKETS, filtered);
    return true;
  }

  deleteByRaffleId(raffleId: string): number {
    const tickets = this.getAll();
    const filtered = tickets.filter((t) => t.raffleId !== raffleId);
    const deletedCount = tickets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.TICKETS, filtered);
    return deletedCount;
  }

  deleteByPrintSetId(printSetId: string): number {
    const tickets = this.getAll();
    const filtered = tickets.filter((t) => t.printSetId !== printSetId);
    const deletedCount = tickets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.TICKETS, filtered);
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
