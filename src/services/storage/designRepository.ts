import { IDesignRepository } from './interfaces';
import { TicketDesign } from '../../types/designer';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';

export class LocalStorageDesignRepository implements IDesignRepository {
  getByRaffleId(raffleId: string): TicketDesign | null {
    const designs = storageAdapter.get<TicketDesign[]>(STORAGE_KEYS.DESIGNS, []);
    return designs.find((d) => d.raffleId === raffleId) || null;
  }

  save(design: TicketDesign): TicketDesign {
    const designs = storageAdapter.get<TicketDesign[]>(STORAGE_KEYS.DESIGNS, []);
    const index = designs.findIndex((d) => d.raffleId === design.raffleId);

    const now = new Date().toISOString();
    const updatedDesign: TicketDesign = {
      ...design,
      updatedAt: now,
      version: (design.version || 0) + 1,
    };

    if (index >= 0) {
      designs[index] = updatedDesign;
    } else {
      updatedDesign.createdAt = now;
      designs.push(updatedDesign);
    }

    storageAdapter.set(STORAGE_KEYS.DESIGNS, designs);
    return updatedDesign;
  }

  delete(raffleId: string): boolean {
    const designs = storageAdapter.get<TicketDesign[]>(STORAGE_KEYS.DESIGNS, []);
    const filtered = designs.filter((d) => d.raffleId !== raffleId);
    if (filtered.length === designs.length) return false;
    storageAdapter.set(STORAGE_KEYS.DESIGNS, filtered);
    return true;
  }
}

export const designRepository = new LocalStorageDesignRepository();
