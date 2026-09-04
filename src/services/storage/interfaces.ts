import { User, AuthSession } from '../../types/auth';
import { Raffle } from '../../types/raffle';
import { Ticket, TicketStatus } from '../../types/ticket';
import { Booklet } from '../../types/booklet';
import { PrintSet } from '../../types/printSet';
import { TicketDesign } from '../../types/designer';
import { PrintLayout } from '../../types/printLayout';
import { AppSettings, ActivityItem, BackupData } from '../../types/settings';

export interface IAuthRepository {
  getCurrentSession(): AuthSession | null;
  saveSession(session: AuthSession, keepLoggedIn?: boolean): void;
  clearSession(): void;
  getUserByEmail(email: string): (User & { passwordHash: string }) | null;
  getUserByUsername?(username: string): (User & { passwordHash: string }) | null;
  createUser(user: User, passwordHash: string): User;
  getAllUsers(): User[];
}

export interface IRaffleRepository {
  getAll(): Raffle[];
  getById(id: string): Raffle | null;
  fetchByIdFromSupabase?(id: string): Promise<Raffle | null>;
  create(raffle: Raffle): Raffle;
  update(id: string, updates: Partial<Raffle>): Raffle | null;
  delete(id: string): boolean;
}

export interface ITicketRepository {
  getAll(filter?: { raffleId?: string; printSetId?: string; bookletId?: string; status?: TicketStatus }): Ticket[];
  getById(id: string): Ticket | null;
  getBySequence(raffleId: string, sequence: number): Ticket | null;
  getByTicketNumber(raffleId: string, ticketNumber: string): Ticket | null;
  getByQrUuid(uuid: string): Ticket | null;
  create(ticket: Ticket): Ticket;
  createMany(tickets: Ticket[]): Ticket[];
  update(id: string, updates: Partial<Ticket>): Ticket | null;
  updateMany(ids: string[], updates: Partial<Ticket>): number;
  delete(id: string): boolean;
  deleteByRaffleId(raffleId: string): number;
  deleteByPrintSetId(printSetId: string): number;
  search(raffleId: string, query: string): Ticket[];
  exists(raffleId: string, sequence: number): boolean;
  getHighestSequence(raffleId: string): number;
}

export interface IBookletRepository {
  getAll(filter?: { raffleId?: string; printSetId?: string }): Booklet[];
  getById(id: string): Booklet | null;
  create(booklet: Booklet): Booklet;
  createMany(booklets: Booklet[]): Booklet[];
  update(id: string, updates: Partial<Booklet>): Booklet | null;
  delete(id: string): boolean;
  deleteByRaffleId(raffleId: string): number;
  deleteByPrintSetId(printSetId: string): number;
}

export interface IPrintSetRepository {
  getAll(filter?: { raffleId?: string }): PrintSet[];
  getById(id: string): PrintSet | null;
  create(printSet: PrintSet): PrintSet;
  update(id: string, updates: Partial<PrintSet>): PrintSet | null;
  delete(id: string): boolean;
  deleteByRaffleId(raffleId: string): number;
  getNextSetNumber(raffleId: string): number;
}

export interface IDesignRepository {
  getByRaffleId(raffleId: string): TicketDesign | null;
  save(design: TicketDesign): TicketDesign;
  delete(raffleId: string): boolean;
}

export interface IPrintLayoutRepository {
  getByRaffleId(raffleId: string): PrintLayout | null;
  save(layout: PrintLayout): PrintLayout;
  delete(raffleId: string): boolean;
}

export interface ISettingsRepository {
  getSettings(): AppSettings;
  saveSettings(settings: Partial<AppSettings>): AppSettings;
  getActivities(): ActivityItem[];
  addActivity(activity: Omit<ActivityItem, 'id' | 'timestamp'>): ActivityItem;
  exportAllData(): BackupData;
  importAllData(data: BackupData): boolean;
  clearAllData(): void;
}
