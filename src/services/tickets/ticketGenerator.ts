import { v4 as uuidv4 } from 'uuid';
import { Ticket } from '../../types/ticket';
import { Booklet } from '../../types/booklet';
import { PrintSet } from '../../types/printSet';
import { ticketFormatter, FormatOptions } from './ticketFormatter';
import { qrService } from '../qr/qrService';
import { ticketsRepository } from '../storage/ticketsRepository';
import { bookletsRepository } from '../storage/bookletsRepository';
import { printSetsRepository } from '../storage/printSetsRepository';
import { rafflesRepository } from '../storage/rafflesRepository';
import { settingsRepository } from '../storage/settingsRepository';

export interface GenerationParams {
  raffleId: string;
  startingTicketNumber: string; // e.g. '0001' or 'R-0001'
  ticketsPerBooklet: number; // T, e.g. 13
  bookletsPerRow: number; // e.g. 5
  numberOfBooklets: number; // B, e.g. 5
  formatOptions?: FormatOptions;
}

export interface GenerationResult {
  success: boolean;
  error?: string;
  printSet?: PrintSet;
  booklets?: Booklet[];
  tickets?: Ticket[];
  totalTickets: number;
  totalPages: number;
}

export const ticketGenerator = {
  /**
   * Determine next starting ticket sequence number and formatted string for a raffle
   */
  getNextStartingSequence(raffleId: string, padding = 4): { nextSequence: number; nextFormatted: string } {
    const highest = ticketsRepository.getHighestSequence(raffleId);
    const nextSequence = highest + 1;
    const nextFormatted = ticketFormatter.formatTicketNumber(nextSequence, { padding });
    return { nextSequence, nextFormatted };
  },

  /**
   * Validate if a range of ticket sequences collides with existing tickets in the raffle
   */
  checkCollision(raffleId: string, startSeq: number, totalCount: number): { hasCollision: boolean; conflictingNumbers: string[] } {
    const endSeq = startSeq + totalCount - 1;
    const existing = ticketsRepository.getAll({ raffleId });
    const conflicting: string[] = [];

    for (const t of existing) {
      if (t.ticketSequence >= startSeq && t.ticketSequence <= endSeq) {
        conflicting.push(t.ticketNumber);
        if (conflicting.length >= 5) break; // cap sample list
      }
    }

    return {
      hasCollision: conflicting.length > 0,
      conflictingNumbers: conflicting,
    };
  },

  /**
   * Generates a full Print Set with consecutive booklets and tickets
   */
  generatePrintSet(params: GenerationParams): GenerationResult {
    const {
      raffleId,
      startingTicketNumber,
      ticketsPerBooklet: T,
      bookletsPerRow,
      numberOfBooklets: B,
      formatOptions = {},
    } = params;

    const raffle = rafflesRepository.getById(raffleId);
    if (!raffle) {
      return { success: false, error: 'Raffle not found', totalTickets: 0, totalPages: 0 };
    }

    if (T <= 0 || B <= 0) {
      return { success: false, error: 'Tickets per booklet and number of booklets must be greater than 0', totalTickets: 0, totalPages: 0 };
    }

    const startSeq = ticketFormatter.parseSequence(startingTicketNumber);
    if (startSeq <= 0) {
      return { success: false, error: 'Invalid starting ticket number', totalTickets: 0, totalPages: 0 };
    }

    const totalTickets = T * B;
    const totalPages = T; // Each page has 1 ticket from each booklet in the row

    // Collision check
    const collision = this.checkCollision(raffleId, startSeq, totalTickets);
    if (collision.hasCollision) {
      return {
        success: false,
        error: `Collision detected! The requested range overlaps with existing ticket(s): ${collision.conflictingNumbers.join(', ')}...`,
        totalTickets,
        totalPages,
      };
    }

    // Determine padding if not explicitly provided
    const padding = formatOptions.padding || ticketFormatter.detectPadding(startingTicketNumber);
    const prefix = formatOptions.prefix || '';
    const suffix = formatOptions.suffix || '';

    const printSetId = uuidv4();
    const setNumber = printSetsRepository.getNextSetNumber(raffleId);
    const endSeq = startSeq + totalTickets - 1;

    const startingFormatted = ticketFormatter.formatTicketNumber(startSeq, { prefix, suffix, padding });
    const endingFormatted = ticketFormatter.formatTicketNumber(endSeq, { prefix, suffix, padding });

    const now = new Date().toISOString();

    // 1. Create Print Set Model
    const printSet: PrintSet = {
      id: printSetId,
      raffleId,
      setNumber,
      startingSequence: startSeq,
      endingSequence: endSeq,
      startingTicketNumber: startingFormatted,
      endingTicketNumber: endingFormatted,
      ticketsPerBooklet: T,
      bookletsPerRow,
      totalBooklets: B,
      totalTickets,
      totalPages,
      status: 'generated',
      createdAt: now,
    };

    const booklets: Booklet[] = [];
    const tickets: Ticket[] = [];

    // 2. Generate Booklets and Tickets
    // Consecutive ticket numbers inside each booklet:
    // Booklet b (0 to B-1): startSeq + (b * T) to startSeq + ((b + 1) * T) - 1
    for (let b = 0; b < B; b++) {
      const bookletId = uuidv4();
      const bookletNum = b + 1;
      const bStartSeq = startSeq + (b * T);
      const bEndSeq = bStartSeq + T - 1;

      const bStartFormatted = ticketFormatter.formatTicketNumber(bStartSeq, { prefix, suffix, padding });
      const bEndFormatted = ticketFormatter.formatTicketNumber(bEndSeq, { prefix, suffix, padding });

      const booklet: Booklet = {
        id: bookletId,
        raffleId,
        printSetId,
        bookletNumber: bookletNum,
        startSequence: bStartSeq,
        endSequence: bEndSeq,
        startTicketNumber: bStartFormatted,
        endTicketNumber: bEndFormatted,
        totalTickets: T,
        status: 'available',
        createdAt: now,
      };
      booklets.push(booklet);

      // Generate the consecutive tickets for this booklet
      for (let seq = bStartSeq; seq <= bEndSeq; seq++) {
        const ticketId = uuidv4();
        const formatted = ticketFormatter.formatTicketNumber(seq, { prefix, suffix, padding });
        const qrValue = qrService.generatePayload(ticketId);

        const ticket: Ticket = {
          id: ticketId,
          raffleId,
          printSetId,
          bookletId,
          ticketSequence: seq,
          ticketNumber: formatted,
          qrValue,
          amount: raffle.ticketAmount,
          status: 'available',
          createdAt: now,
        };
        tickets.push(ticket);
      }
    }

    // Persist all generated records
    printSetsRepository.create(printSet);
    bookletsRepository.createMany(booklets);
    ticketsRepository.createMany(tickets);

    // Record activity
    settingsRepository.addActivity({
      type: 'tickets_generated',
      title: `Generated Print Set #${setNumber}`,
      description: `${totalTickets} tickets (${startingFormatted}–${endingFormatted}) in ${B} booklets for ${raffle.raffleName}`,
      raffleId,
    });

    return {
      success: true,
      printSet,
      booklets,
      tickets,
      totalTickets,
      totalPages,
    };
  },
};
