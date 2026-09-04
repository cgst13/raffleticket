export type RaffleStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Raffle {
  id: string;
  raffleName: string;
  eventName: string;
  ticketName: string;
  ticketAmount: number;
  drawDate: string; // YYYY-MM-DD
  drawTime?: string; // HH:mm
  venue?: string;
  description?: string;
  managers?: string[]; // Manager emails authorized for this event
  status: RaffleStatus;
  createdAt: string;
  updatedAt: string;
}
