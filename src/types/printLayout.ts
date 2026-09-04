export type PaperSize = 'Folio' | 'A4' | 'Letter' | 'Legal' | 'Custom';
export type PageOrientation = 'portrait' | 'landscape';

export interface PageDimensionMm {
  width: number;
  height: number;
}

export const PAPER_DIMENSIONS_MM: Record<Exclude<PaperSize, 'Custom'>, Record<PageOrientation, PageDimensionMm>> = {
  Folio: {
    portrait: { width: 215.9, height: 330.2 }, // 8.5 x 13 in
    landscape: { width: 330.2, height: 215.9 }, // 13 x 8.5 in
  },
  A4: {
    portrait: { width: 210, height: 297 },
    landscape: { width: 297, height: 210 },
  },
  Letter: {
    portrait: { width: 215.9, height: 279.4 },
    landscape: { width: 279.4, height: 215.9 },
  },
  Legal: {
    portrait: { width: 215.9, height: 355.6 },
    landscape: { width: 355.6, height: 215.9 },
  },
};

export interface MarginsMm {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface CalibrationOffsetMm {
  offsetX: number; // Small +/- calibration offset
  offsetY: number;
  gapAdjustX: number;
  gapAdjustY: number;
}

export interface PrintLayout {
  id: string;
  raffleId: string;
  paperSize: PaperSize;
  customPaperWidthMm?: number;
  customPaperHeightMm?: number;
  orientation: PageOrientation;
  margins: MarginsMm;
  ticketWidthMm: number;
  ticketHeightMm: number;
  horizontalGapMm: number;
  verticalGapMm: number;
  ticketsPerRow: number;
  rowsPerPage: number;
  showCropMarks: boolean;
  showTicketBorders: boolean;
  showBookletNumber: boolean;
  showPrintGuides: boolean;
  showPageNumbers: boolean;
  calibration: CalibrationOffsetMm;
}
