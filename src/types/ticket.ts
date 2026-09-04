export type TicketStatus = 'available' | 'assigned' | 'sold' | 'cancelled' | 'used';

export interface Ticket {
  id: string; // Internal UUID
  raffleId: string;
  printSetId: string;
  bookletId: string;
  ticketSequence: number; // Raw integer numeric sequence (e.g. 1)
  ticketNumber: string; // Formatted ticket number (e.g. 0001 or R-0001)
  qrValue: string; // raffle://ticket/{UUID}
  amount: number;
  solicitorName?: string; // Overrides booklet solicitor if present
  buyerName?: string; // Overrides booklet buyer if present
  status: TicketStatus;
  createdAt: string;
  assignedAt?: string;
  soldAt?: string;
  usedAt?: string;
}
