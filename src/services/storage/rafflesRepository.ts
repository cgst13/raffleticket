import { IRaffleRepository } from './interfaces';
import { Raffle } from '../../types/raffle';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';

export class LocalStorageRaffleRepository implements IRaffleRepository {
  getAll(): Raffle[] {
    return storageAdapter.get<Raffle[]>(STORAGE_KEYS.RAFFLES, []);
  }

  getById(id: string): Raffle | null {
    const raffles = this.getAll();
    return raffles.find((r) => r.id === id) || null;
  }

  create(raffle: Raffle): Raffle {
    const raffles = this.getAll();
    raffles.unshift(raffle);
    storageAdapter.set(STORAGE_KEYS.RAFFLES, raffles);
    return raffle;
  }

  update(id: string, updates: Partial<Raffle>): Raffle | null {
    const raffles = this.getAll();
    const index = raffles.findIndex((r) => r.id === id);
    if (index === -1) return null;

    raffles[index] = {
      ...raffles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    storageAdapter.set(STORAGE_KEYS.RAFFLES, raffles);
    return raffles[index];
  }

  delete(id: string): boolean {
    const raffles = this.getAll();
    const filtered = raffles.filter((r) => r.id !== id);
    if (filtered.length === raffles.length) return false;
    storageAdapter.set(STORAGE_KEYS.RAFFLES, filtered);
    return true;
  }
}

export const rafflesRepository = new LocalStorageRaffleRepository();
