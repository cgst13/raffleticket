import { Raffle } from './raffle';
import { Ticket } from './ticket';
import { Booklet } from './booklet';
import { PrintSet } from './printSet';
import { TicketDesign } from './designer';
import { PrintLayout } from './printLayout';
import { User } from './auth';
import { Expense } from './expense';

export interface AppSettings {
  appName: string;
  theme: 'light' | 'dark' | 'system';
  defaultTicketAmount: number;
  defaultNumberPadding: number;
  defaultPaperSize: 'Folio' | 'A4' | 'Letter' | 'Legal' | 'Custom';
  defaultOrientation: 'portrait' | 'landscape';
  defaultTicketsPerRow: number;
}

export interface ActivityItem {
  id: string;
  type: 'raffle_created' | 'tickets_generated' | 'tickets_assigned' | 'ticket_sold' | 'ticket_used' | 'print_set_printed';
  title: string;
  description: string;
  timestamp: string;
  raffleId?: string;
  ticketNumber?: string;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  users: User[];
  raffles: Raffle[];
  designs: TicketDesign[];
  printLayouts: PrintLayout[];
  printSets: PrintSet[];
  booklets: Booklet[];
  tickets: Ticket[];
  expenses?: Expense[];
  activities: ActivityItem[];
  settings: AppSettings;
}
