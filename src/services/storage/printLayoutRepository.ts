import { IPrintLayoutRepository } from './interfaces';
import { PrintLayout } from '../../types/printLayout';
import { STORAGE_KEYS } from './storageKeys';
import { storageAdapter } from './storageAdapter';
import { appConfig } from '../../config/appConfig';

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
    return layout;
  }

  delete(raffleId: string): boolean {
    const layouts = storageAdapter.get<PrintLayout[]>(STORAGE_KEYS.PRINT_LAYOUTS, []);
    const filtered = layouts.filter((l) => l.raffleId !== raffleId);
    if (filtered.length === layouts.length) return false;
    storageAdapter.set(STORAGE_KEYS.PRINT_LAYOUTS, filtered);
    return true;
  }
}

export const printLayoutRepository = new LocalStoragePrintLayoutRepository();
