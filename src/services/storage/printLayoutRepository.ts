import { IPrintLayoutRepository } from './interfaces';
import { PrintLayout } from '../../types/printLayout';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { appConfig } from '../../config/appConfig';
import { supabase, isSupabaseConfigured } from '../supabase/supabaseClient';

export const getDefaultPrintLayout = (raffleId: string): PrintLayout => ({
  id: `layout_${raffleId}`,
  raffleId,
  paperSize: appConfig.defaults.paperSize,
  orientation: appConfig.defaults.orientation,
  margins: { top: 10, bottom: 10, left: 10, right: 10 },
  ticketWidthMm: appConfig.defaults.ticketWidthMm,
  ticketHeightMm: appConfig.defaults.ticketHeightMm,
  horizontalGapMm: 0,
  verticalGapMm: 4,
  ticketsPerRow: appConfig.defaults.bookletsPerRow, // 5 horizontal tickets
  rowsPerPage: 1, // 1 row of 5 tickets
  showCropMarks: true,
  showTicketBorders: true,
  showBookletNumber: false,
  showPrintGuides: false,
  showPageNumbers: true,
  calibration: {
    offsetX: 0,
    offsetY: 0,
    gapAdjustX: 0,
    gapAdjustY: 0,
  },
});

export class LocalStoragePrintLayoutRepository implements IPrintLayoutRepository {
  getByRaffleId(raffleId: string): PrintLayout | null {
    const layouts = storageAdapter.get<PrintLayout[]>(STORAGE_KEYS.PRINT_LAYOUTS, []);
    const found = layouts.find((l) => l.raffleId === raffleId);
    return found || getDefaultPrintLayout(raffleId);
  }

  save(layout: PrintLayout): PrintLayout {
    const layouts = storageAdapter.get<PrintLayout[]>(STORAGE_KEYS.PRINT_LAYOUTS, []);
    const index = layouts.findIndex((l) => l.raffleId === layout.raffleId);

    if (index >= 0) {
      layouts[index] = layout;
    } else {
      layouts.push(layout);
    }

    storageAdapter.set(STORAGE_KEYS.PRINT_LAYOUTS, layouts);

    if (isSupabaseConfigured()) {
      const now = new Date().toISOString();
      Promise.resolve(
        supabase.from('print_layouts').upsert(
          {
            id: layout.id,
            raffle_id: layout.raffleId,
            paper_size: layout.paperSize,
            orientation: layout.orientation,
            margins: layout.margins,
            ticket_width_mm: layout.ticketWidthMm,
            ticket_height_mm: layout.ticketHeightMm,
            tickets_per_row: layout.ticketsPerRow,
            rows_per_page: layout.rowsPerPage,
            vertical_gap_mm: layout.verticalGapMm,
            horizontal_gap_mm: layout.horizontalGapMm,
            show_crop_marks: layout.showCropMarks,
            show_ticket_borders: layout.showTicketBorders,
            show_page_numbers: layout.showPageNumbers,
            show_booklet_number: layout.showBookletNumber,
            show_print_guides: layout.showPrintGuides ?? true,
            calibration: layout.calibration,
            created_at: now,
            updated_at: now,
          },
          { onConflict: 'id' }
        )
      )
        .then((res: any) => {
          if (res?.error) console.error('Supabase layout save error:', res.error);
        })
        .catch((err) => console.error('Supabase layout save error:', err));
    }

    return layout;
  }

  delete(raffleId: string): boolean {
    const layouts = storageAdapter.get<PrintLayout[]>(STORAGE_KEYS.PRINT_LAYOUTS, []);
    const filtered = layouts.filter((l) => l.raffleId !== raffleId);
    if (filtered.length === layouts.length) return false;
    storageAdapter.set(STORAGE_KEYS.PRINT_LAYOUTS, filtered);

    if (isSupabaseConfigured()) {
      Promise.resolve(supabase.from('print_layouts').delete().eq('raffle_id', raffleId))
        .then((res: any) => {
          if (res?.error) console.error('Supabase layout delete error:', res.error);
        })
        .catch((err) => console.error('Supabase layout delete error:', err));
    }

    return true;
  }
}

export const printLayoutRepository = new LocalStoragePrintLayoutRepository();

