import { ticketsRepository } from '../storage/ticketsRepository';
import { bookletsRepository } from '../storage/bookletsRepository';

export interface RecordedNameOption {
  name: string;
  count: number;
}

export const recordNamesService = {
  /**
   * Returns all unique solicitor names from previous records (tickets & booklets)
   * ranked by frequency of use.
   */
  getRecordedSolicitors(raffleId?: string): RecordedNameOption[] {
    const counts = new Map<string, { count: number; canonicalName: string }>();

    const allTickets = raffleId
      ? ticketsRepository.getAll({ raffleId })
      : ticketsRepository.getAll();
    const allBooklets = raffleId
      ? bookletsRepository.getAll({ raffleId })
      : bookletsRepository.getAll();

    allTickets.forEach((t) => {
      if (t.solicitorName && t.solicitorName.trim()) {
        const trimmed = t.solicitorName.trim();
        const key = trimmed.toLowerCase();
        const cur = counts.get(key) || { count: 0, canonicalName: trimmed };
        cur.count += 1;
        counts.set(key, cur);
      }
    });

    allBooklets.forEach((b) => {
      if (b.solicitorName && b.solicitorName.trim()) {
        const trimmed = b.solicitorName.trim();
        const key = trimmed.toLowerCase();
        const cur = counts.get(key) || { count: 0, canonicalName: trimmed };
        cur.count += 1;
        counts.set(key, cur);
      }
    });

    return Array.from(counts.values())
      .map((item) => ({ name: item.canonicalName, count: item.count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  },

  /**
   * Returns all unique buyer names from previous records (tickets & booklets)
   * ranked by frequency of use.
   */
  getRecordedBuyers(raffleId?: string): RecordedNameOption[] {
    const counts = new Map<string, { count: number; canonicalName: string }>();

    const allTickets = raffleId
      ? ticketsRepository.getAll({ raffleId })
      : ticketsRepository.getAll();
    const allBooklets = raffleId
      ? bookletsRepository.getAll({ raffleId })
      : bookletsRepository.getAll();

    allTickets.forEach((t) => {
      if (t.buyerName && t.buyerName.trim()) {
        const trimmed = t.buyerName.trim();
        const key = trimmed.toLowerCase();
        const cur = counts.get(key) || { count: 0, canonicalName: trimmed };
        cur.count += 1;
        counts.set(key, cur);
      }
    });

    allBooklets.forEach((b) => {
      if (b.buyerName && b.buyerName.trim()) {
        const trimmed = b.buyerName.trim();
        const key = trimmed.toLowerCase();
        const cur = counts.get(key) || { count: 0, canonicalName: trimmed };
        cur.count += 1;
        counts.set(key, cur);
      }
    });

    return Array.from(counts.values())
      .map((item) => ({ name: item.canonicalName, count: item.count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  },
};
