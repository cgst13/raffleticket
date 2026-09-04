export type BookletStatus = 'available' | 'assigned' | 'sold' | 'completed' | 'cancelled';

export interface Booklet {
  id: string; // UUID
  raffleId: string;
  printSetId: string;
  bookletNumber: number; // 1, 2, 3...
  startSequence: number; // e.g. 1
  endSequence: number; // e.g. 13
  startTicketNumber: string; // formatted e.g. '0001'
  endTicketNumber: string; // formatted e.g. '0013'
  totalTickets: number; // e.g. 13
  solicitorName?: string;
  buyerName?: string;
  status: BookletStatus;
  createdAt: string;
}
