import { IPrintSetRepository } from './interfaces';
import { PrintSet } from '../../types/printSet';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';

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
    return printSet;
  }

  update(id: string, updates: Partial<PrintSet>): PrintSet | null {
    const sets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
    const index = sets.findIndex((s) => s.id === id);
    if (index === -1) return null;

    sets[index] = { ...sets[index], ...updates };
    storageAdapter.set(STORAGE_KEYS.PRINT_SETS, sets);
    return sets[index];
  }

  delete(id: string): boolean {
    const sets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
    const filtered = sets.filter((s) => s.id !== id);
    if (filtered.length === sets.length) return false;
    storageAdapter.set(STORAGE_KEYS.PRINT_SETS, filtered);
    return true;
  }

  deleteByRaffleId(raffleId: string): number {
    const sets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
    const filtered = sets.filter((s) => s.raffleId !== raffleId);
    const count = sets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.PRINT_SETS, filtered);
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
