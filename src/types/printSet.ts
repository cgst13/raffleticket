export type PrintSetStatus = 'generated' | 'printed' | 'reprinted';

export interface PrintSet {
  id: string; // UUID
  raffleId: string;
  setNumber: number; // 1, 2, 3...
  startingSequence: number; // Raw number e.g. 1
  endingSequence: number; // Raw number e.g. 65
  startingTicketNumber: string; // Formatted '0001'
  endingTicketNumber: string; // Formatted '0065'
  ticketsPerBooklet: number; // e.g. 13
  bookletsPerRow: number; // e.g. 5
  totalBooklets: number; // e.g. 5
  totalTickets: number; // e.g. 65
  totalPages: number; // e.g. 13
  status: PrintSetStatus;
  createdAt: string;
}
