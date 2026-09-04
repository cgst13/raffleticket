import { PrintSet } from '../../types/printSet';
import { Ticket } from '../../types/ticket';
import { Booklet } from '../../types/booklet';
import { PrintLayout, PAPER_DIMENSIONS_MM, PageDimensionMm } from '../../types/printLayout';
import { ticketsRepository } from '../storage/ticketsRepository';
import { bookletsRepository } from '../storage/bookletsRepository';

export interface InterleavedTicketSlot {
  pageIndex: number; // 0-indexed
  bookletIndex: number; // 0-indexed
  rowNumber: number;
  columnNumber: number;
  expectedSequence: number;
  ticket?: Ticket;
  booklet?: Booklet;
  resolvedSolicitor: string;
  resolvedBuyer: string;
}

export interface InterleavedPage {
  pageNumber: number; // 1-indexed for display
  totalSlots: number;
  slots: InterleavedTicketSlot[];
}

export const printLayoutEngine = {
  /**
   * Generic formula as specified in spec section 24:
   * startingNumber + (B * T) + P (using zero-based internal indexing)
   * where:
   *  startingNumber: start sequence integer (e.g. 1)
   *  B: booklet index (0 to totalBooklets - 1)
   *  T: tickets per booklet
   *  P: page index (0 to ticketsPerBooklet - 1)
   */
  calculateSequence(startingNumber: number, T: number, B: number, P: number): number {
    return startingNumber + (B * T) + P;
  },

  /**
   * Calculates the exact paper dimensions in mm
   */
  getPageDimensions(layout: PrintLayout): PageDimensionMm {
    if (layout.paperSize === 'Custom') {
      return {
        width: layout.customPaperWidthMm || 210,
        height: layout.customPaperHeightMm || 297,
      };
    }
    const standard = PAPER_DIMENSIONS_MM[layout.paperSize];
    return standard ? standard[layout.orientation] : { width: 210, height: 297 };
  },

  /**
   * Generates all interleaved pages for a given Print Set.
   * Interleaving rule: Page P has ticket at position P from each booklet.
   */
  generateInterleavedPages(printSet: PrintSet, layout: PrintLayout): InterleavedPage[] {
    const { startingSequence, ticketsPerBooklet: T, totalBooklets: B, bookletsPerRow } = printSet;

    // Fetch actual tickets & booklets for this print set
    const allTickets = ticketsRepository.getAll({ printSetId: printSet.id });
    const allBooklets = bookletsRepository.getAll({ printSetId: printSet.id });

    // Map for rapid lookup by sequence
    const ticketMap = new Map<number, Ticket>();
    for (const t of allTickets) {
      ticketMap.set(t.ticketSequence, t);
    }

    // Map for rapid lookup by bookletNumber
    const bookletMap = new Map<number, Booklet>();
    for (const b of allBooklets) {
      bookletMap.set(b.bookletNumber, b);
    }

    const pages: InterleavedPage[] = [];

    // T pages total (each page contains 1 ticket from each of the B booklets)
    for (let p = 0; p < T; p++) {
      const pageSlots: InterleavedTicketSlot[] = [];

      for (let b = 0; b < B; b++) {
        const expectedSeq = this.calculateSequence(startingSequence, T, b, p);
        const ticket = ticketMap.get(expectedSeq);
        const booklet = bookletMap.get(b + 1);

        // Value resolution hierarchy: Ticket override -> Booklet default -> ''
        const resolvedSolicitor =
          (ticket?.solicitorName && ticket.solicitorName.trim()) ||
          (booklet?.solicitorName && booklet.solicitorName.trim()) ||
          '';

        const resolvedBuyer =
          (ticket?.buyerName && ticket.buyerName.trim()) ||
          (booklet?.buyerName && booklet.buyerName.trim()) ||
          '';

        const col = b % (bookletsPerRow || 5);
        const row = Math.floor(b / (bookletsPerRow || 5));

        pageSlots.push({
          pageIndex: p,
          bookletIndex: b,
          rowNumber: row,
          columnNumber: col,
          expectedSequence: expectedSeq,
          ticket,
          booklet,
          resolvedSolicitor,
          resolvedBuyer,
        });
      }

      pages.push({
        pageNumber: p + 1,
        totalSlots: pageSlots.length,
        slots: pageSlots,
      });
    }

    return pages;
  },
};
