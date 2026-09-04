import { IBookletRepository } from './interfaces';
import { Booklet } from '../../types/booklet';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';

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
    return booklet;
  }

  createMany(newBooklets: Booklet[]): Booklet[] {
    const booklets = this.getAll();
    booklets.push(...newBooklets);
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, booklets);
    return newBooklets;
  }

  update(id: string, updates: Partial<Booklet>): Booklet | null {
    const booklets = this.getAll();
    const index = booklets.findIndex((b) => b.id === id);
    if (index === -1) return null;

    booklets[index] = { ...booklets[index], ...updates };
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, booklets);
    return booklets[index];
  }

  delete(id: string): boolean {
    const booklets = this.getAll();
    const filtered = booklets.filter((b) => b.id !== id);
    if (filtered.length === booklets.length) return false;
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, filtered);
    return true;
  }

  deleteByRaffleId(raffleId: string): number {
    const booklets = this.getAll();
    const filtered = booklets.filter((b) => b.raffleId !== raffleId);
    const count = booklets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, filtered);
    return count;
  }

  deleteByPrintSetId(printSetId: string): number {
    const booklets = this.getAll();
    const filtered = booklets.filter((b) => b.printSetId !== printSetId);
    const count = booklets.length - filtered.length;
    storageAdapter.set(STORAGE_KEYS.BOOKLETS, filtered);
    return count;
  }
}

export const bookletsRepository = new LocalStorageBookletRepository();
