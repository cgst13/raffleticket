import { describe, it, expect, beforeEach } from 'vitest';
import { ticketFormatter } from '../services/tickets/ticketFormatter';
import { ticketGenerator } from '../services/tickets/ticketGenerator';
import { printLayoutEngine } from '../services/printing/printLayoutEngine';
import { qrService } from '../services/qr/qrService';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { printSetsRepository } from '../services/storage/printSetsRepository';
import { settingsRepository } from '../services/storage/settingsRepository';

describe('Critical Business Logic & Printing Algorithms', () => {
  const testRaffleId = 'test-raffle-123';

  beforeEach(() => {
    // Clear storage before each test
    settingsRepository.clearAllData();

    // Create a mock raffle
    rafflesRepository.create({
      id: testRaffleId,
      raffleName: 'Grand Raffle 2026',
      eventName: 'Fiesta 2026',
      ticketName: 'Grand Ticket',
      ticketAmount: 100,
      drawDate: '2026-12-20',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  it('Requirement #60: formats ticket numbers with zero padding and prefix correctly', () => {
    expect(ticketFormatter.formatTicketNumber(1, { padding: 4 })).toBe('0001');
    expect(ticketFormatter.formatTicketNumber(13, { padding: 4 })).toBe('0013');
    expect(ticketFormatter.formatTicketNumber(65, { padding: 4 })).toBe('0065');
    expect(ticketFormatter.formatTicketNumber(1, { prefix: 'R-', padding: 6 })).toBe('R-000001');
    expect(ticketFormatter.formatTicketNumber(1, { prefix: '2026-', padding: 4 })).toBe('2026-0001');
  });

  it('Requirement #22 & #69: generates exact consecutive numbers inside each booklet (13 tickets, 5 booklets)', () => {
    const result = ticketGenerator.generatePrintSet({
      raffleId: testRaffleId,
      startingTicketNumber: '0001',
      ticketsPerBooklet: 13,
      bookletsPerRow: 5,
      numberOfBooklets: 5,
    });

    expect(result.success).toBe(true);
    expect(result.totalTickets).toBe(65);
    expect(result.booklets?.length).toBe(5);
    expect(result.tickets?.length).toBe(65);

    const booklets = result.booklets!;
    // Booklet 1: 0001–0013
    expect(booklets[0].startSequence).toBe(1);
    expect(booklets[0].endSequence).toBe(13);
    expect(booklets[0].startTicketNumber).toBe('0001');
    expect(booklets[0].endTicketNumber).toBe('0013');

    // Booklet 2: 0014–0026
    expect(booklets[1].startSequence).toBe(14);
    expect(booklets[1].endSequence).toBe(26);
    expect(booklets[1].startTicketNumber).toBe('0014');
    expect(booklets[1].endTicketNumber).toBe('0026');

    // Booklet 3: 0027–0039
    expect(booklets[2].startSequence).toBe(27);
    expect(booklets[2].endSequence).toBe(39);

    // Booklet 4: 0040–0052
    expect(booklets[3].startSequence).toBe(40);
    expect(booklets[3].endSequence).toBe(52);

    // Booklet 5: 0053–0065
    expect(booklets[4].startSequence).toBe(53);
    expect(booklets[4].endSequence).toBe(65);
    expect(booklets[4].startTicketNumber).toBe('0053');
    expect(booklets[4].endTicketNumber).toBe('0065');
  });

  it('Requirement #23 & #24: implements generic interleaving formula: startingNumber + (B * T) + P', () => {
    const startingNumber = 1;
    const T = 13;
    const B_count = 5;

    // Page 1 (P = 0):
    // b = 0 -> 1 + (0*13) + 0 = 1
    // b = 1 -> 1 + (1*13) + 0 = 14
    // b = 2 -> 1 + (2*13) + 0 = 27
    // b = 3 -> 1 + (3*13) + 0 = 40
    // b = 4 -> 1 + (4*13) + 0 = 53
    const page1Tickets = Array.from({ length: B_count }, (_, b) =>
      printLayoutEngine.calculateSequence(startingNumber, T, b, 0)
    );
    expect(page1Tickets).toEqual([1, 14, 27, 40, 53]);

    // Page 2 (P = 1):
    const page2Tickets = Array.from({ length: B_count }, (_, b) =>
      printLayoutEngine.calculateSequence(startingNumber, T, b, 1)
    );
    expect(page2Tickets).toEqual([2, 15, 28, 41, 54]);

    // Page 13 (P = 12):
    // b = 0 -> 1 + 0 + 12 = 13
    // b = 1 -> 1 + 13 + 12 = 26
    // b = 2 -> 1 + 26 + 12 = 39
    // b = 3 -> 1 + 39 + 12 = 52
    // b = 4 -> 1 + 52 + 12 = 65
    const page13Tickets = Array.from({ length: B_count }, (_, b) =>
      printLayoutEngine.calculateSequence(startingNumber, T, b, 12)
    );
    expect(page13Tickets).toEqual([13, 26, 39, 52, 65]);
  });

  it('Requirement #26: detects next available starting sequence accurately', () => {
    // Generate Set 1: 0001 - 0065
    ticketGenerator.generatePrintSet({
      raffleId: testRaffleId,
      startingTicketNumber: '0001',
      ticketsPerBooklet: 13,
      bookletsPerRow: 5,
      numberOfBooklets: 5,
    });

    const nextInfo = ticketGenerator.getNextStartingSequence(testRaffleId, 4);
    expect(nextInfo.nextSequence).toBe(66);
    expect(nextInfo.nextFormatted).toBe('0066');

    // Generate Set 2: 0066 - 0130
    const set2 = ticketGenerator.generatePrintSet({
      raffleId: testRaffleId,
      startingTicketNumber: nextInfo.nextFormatted,
      ticketsPerBooklet: 13,
      bookletsPerRow: 5,
      numberOfBooklets: 5,
    });
    expect(set2.success).toBe(true);
    expect(set2.printSet?.startingSequence).toBe(66);
    expect(set2.printSet?.endingSequence).toBe(130);

    // Check Set 3 start: 131
    const nextInfo2 = ticketGenerator.getNextStartingSequence(testRaffleId, 4);
    expect(nextInfo2.nextSequence).toBe(131);
    expect(nextInfo2.nextFormatted).toBe('0131');
  });

  it('Requirement #26: stops generation and reports collision if duplicate numbers exist', () => {
    // Generate 1 to 65
    ticketGenerator.generatePrintSet({
      raffleId: testRaffleId,
      startingTicketNumber: '0001',
      ticketsPerBooklet: 13,
      bookletsPerRow: 5,
      numberOfBooklets: 5,
    });

    // Attempting to generate overlapping range: starting at 0050
    const conflictResult = ticketGenerator.generatePrintSet({
      raffleId: testRaffleId,
      startingTicketNumber: '0050',
      ticketsPerBooklet: 10,
      bookletsPerRow: 5,
      numberOfBooklets: 2,
    });

    expect(conflictResult.success).toBe(false);
    expect(conflictResult.error).toContain('Collision detected');
  });

  it('Requirement #14 & #69: ensures every single ticket has a unique QR code payload', () => {
    const result = ticketGenerator.generatePrintSet({
      raffleId: testRaffleId,
      startingTicketNumber: '0001',
      ticketsPerBooklet: 13,
      bookletsPerRow: 5,
      numberOfBooklets: 5,
    });

    const tickets = result.tickets!;
    const qrPayloads = new Set(tickets.map((t) => t.qrValue));
    expect(qrPayloads.size).toBe(65);

    // Verify format
    const sample = tickets[0];
    expect(sample.qrValue).toBe(`raffle://ticket/${sample.id}`);
    expect(qrService.extractTicketId(sample.qrValue)).toBe(sample.id);
  });

  it('Requirement #Folio: correctly provides 8.5 x 13 inch dimensions for Folio paper size', () => {
    const portraitDims = printLayoutEngine.getPageDimensions({
      id: 'layout-1',
      raffleId: testRaffleId,
      paperSize: 'Folio',
      orientation: 'portrait',
      margins: { top: 5, bottom: 5, left: 5, right: 5 },
      ticketWidthMm: 205.9,
      ticketHeightMm: 64,
      horizontalGapMm: 0,
      verticalGapMm: 0,
      ticketsPerRow: 1,
      rowsPerPage: 5,
      showCropMarks: true,
      showTicketBorders: true,
      showBookletNumber: false,
      showPrintGuides: true,
      showPageNumbers: true,
      calibration: { offsetX: 0, offsetY: 0, gapAdjustX: 0, gapAdjustY: 0 },
    });

    expect(portraitDims.width).toBe(215.9); // 8.5 inches
    expect(portraitDims.height).toBe(330.2); // 13 inches
  });

  it('Event Managers: validates authorized manager emails and persists manager lists on raffles', () => {
    // 1. Initial raffle has empty or undefined managers
    let r = rafflesRepository.getById(testRaffleId)!;
    expect(r.managers).toBeUndefined();

    // 2. Add manager emails
    const managersList = ['manager1@event.org', 'staff_lead@charity.com'];
    rafflesRepository.update(testRaffleId, { managers: managersList });

    r = rafflesRepository.getById(testRaffleId)!;
    expect(r.managers).toEqual(managersList);

    // 3. Check authorization logic
    const authorized = (r.managers || []).map((m) => m.toLowerCase());
    expect(authorized.includes('manager1@event.org')).toBe(true);
    expect(authorized.includes('MANAGER1@EVENT.ORG'.toLowerCase())).toBe(true);
    expect(authorized.includes('unauthorized@domain.com')).toBe(false);

    // 4. Remove a manager
    const updatedManagers = r.managers!.filter((m) => m !== 'manager1@event.org');
    rafflesRepository.update(testRaffleId, { managers: updatedManagers });

    r = rafflesRepository.getById(testRaffleId)!;
    expect(r.managers).toEqual(['staff_lead@charity.com']);
  });
});
