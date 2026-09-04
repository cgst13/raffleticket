import { IRaffleRepository } from './interfaces';
import { Raffle } from '../../types/raffle';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

export class LocalStorageRaffleRepository implements IRaffleRepository {
  getAll(): Raffle[] {
    return storageAdapter.get<Raffle[]>(STORAGE_KEYS.RAFFLES, []);
  }

  getById(id: string): Raffle | null {
    const raffles = this.getAll();
    return raffles.find((r) => r.id === id) || null;
  }

  async fetchByIdFromSupabase(id: string): Promise<Raffle | null> {
    const local = this.getById(id);
    if (local) return local;

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('raffles')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (data && !error) {
          const r: Raffle = {
            id: data.id,
            eventName: data.event_name,
            raffleName: data.raffle_name,
            ticketName: data.ticket_name || 'General Admission',
            ticketAmount: Number(data.ticket_amount),
            drawDate: data.draw_date,
            drawTime: data.draw_time || undefined,
            venue: data.venue || undefined,
            status: data.status,
            description: data.description || undefined,
            managers: data.managers || [],
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };

          const raffles = this.getAll();
          const existingIdx = raffles.findIndex((x) => x.id === r.id);
          if (existingIdx >= 0) {
            raffles[existingIdx] = r;
          } else {
            raffles.unshift(r);
          }
          storageAdapter.set(STORAGE_KEYS.RAFFLES, raffles);
          return r;
        }
      } catch (err) {
        console.warn('Supabase fetch raffle by id fallback error:', err);
      }
    }
    return null;
  }

  create(raffle: Raffle): Raffle {
    const raffles = this.getAll();
    raffles.unshift(raffle);
    storageAdapter.set(STORAGE_KEYS.RAFFLES, raffles);

    if (isSupabaseConfigured()) {
      Promise.resolve(
        supabase.from('raffles').upsert(
          {
            id: raffle.id,
            event_name: raffle.eventName,
            raffle_name: raffle.raffleName,
            ticket_name: raffle.ticketName || 'General Admission',
            ticket_amount: raffle.ticketAmount,
            draw_date: raffle.drawDate,
            draw_time: raffle.drawTime || null,
            venue: raffle.venue || null,
            description: raffle.description || '',
            managers: raffle.managers || [],
            status: raffle.status,
            created_at: raffle.createdAt,
            updated_at: raffle.updatedAt,
          },
          { onConflict: 'id' }
        )
      )
        .then((res: any) => {
          if (res?.error) console.error('Supabase raffle create error:', res.error);
        })
        .catch((err) => console.error('Supabase raffle create error:', err));
    }

    return raffle;
  }

  update(id: string, updates: Partial<Raffle>): Raffle | null {
    const raffles = this.getAll();
    const index = raffles.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const updated = {
      ...raffles[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    raffles[index] = updated;
    storageAdapter.set(STORAGE_KEYS.RAFFLES, raffles);

    if (isSupabaseConfigured()) {
      const payload: any = {
        updated_at: updated.updatedAt,
      };
      if (updates.eventName !== undefined) payload.event_name = updates.eventName;
      if (updates.raffleName !== undefined) payload.raffle_name = updates.raffleName;
      if (updates.ticketName !== undefined) payload.ticket_name = updates.ticketName;
      if (updates.ticketAmount !== undefined) payload.ticket_amount = updates.ticketAmount;
      if (updates.drawDate !== undefined) payload.draw_date = updates.drawDate;
      if (updates.drawTime !== undefined) payload.draw_time = updates.drawTime || null;
      if (updates.venue !== undefined) payload.venue = updates.venue || null;
      if (updates.description !== undefined) payload.description = updates.description || '';
      if (updates.managers !== undefined) payload.managers = updates.managers || [];
      if (updates.status !== undefined) payload.status = updates.status;

      Promise.resolve(supabase.from('raffles').update(payload).eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase raffle update error:', res.error);
        })
        .catch((err) => console.error('Supabase raffle update error:', err));
    }

    return updated;
  }

  delete(id: string): boolean {
    const raffles = this.getAll();
    const filtered = raffles.filter((r) => r.id !== id);
    if (filtered.length === raffles.length) return false;
    storageAdapter.set(STORAGE_KEYS.RAFFLES, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('raffles').delete().eq('id', id))
        .then((res: any) => {
          if (res?.error) console.error('Supabase raffle delete error:', res.error);
        })
        .catch((err) => console.error('Supabase raffle delete error:', err));
    }

    return true;
  }
}

export const rafflesRepository = new LocalStorageRaffleRepository();

