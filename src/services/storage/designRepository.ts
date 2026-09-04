import { IDesignRepository } from './interfaces';
import { TicketDesign } from '../../types/designer';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

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

    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase.from('ticket_designs').upsert(
          {
            id: updatedDesign.id,
            raffle_id: updatedDesign.raffleId,
            name: updatedDesign.name,
            width_mm: updatedDesign.widthMm,
            height_mm: updatedDesign.heightMm,
            background_image_url: updatedDesign.backgroundImageUrl || '',
            background_color: updatedDesign.backgroundColor || '#FFFFFF',
            elements: updatedDesign.elements || [],
            version: updatedDesign.version,
            created_at: updatedDesign.createdAt || now,
            updated_at: now,
          },
          { onConflict: 'id' }
        )
      )
        .then((res: any) => {
          if (res?.error) console.error('Supabase design save error:', res.error);
        })
        .catch((err) => console.error('Supabase design save error:', err));
    }

    return updatedDesign;
  }

  delete(raffleId: string): boolean {
    const designs = storageAdapter.get<TicketDesign[]>(STORAGE_KEYS.DESIGNS, []);
    const filtered = designs.filter((d) => d.raffleId !== raffleId);
    if (filtered.length === designs.length) return false;
    storageAdapter.set(STORAGE_KEYS.DESIGNS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('ticket_designs').delete().eq('raffle_id', raffleId))
        .then((res: any) => {
          if (res?.error) console.error('Supabase design delete error:', res.error);
        })
        .catch((err) => console.error('Supabase design delete error:', err));
    }

    return true;
  }
}

export const designRepository = new LocalStorageDesignRepository();

