import { supabase, isSupabaseConfigured } from './supabaseClient';
import { storageAdapter } from '../storage/storageAdapter';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { Raffle } from '../../types/raffle';
import { TicketDesign } from '../../types/designer';
import { PrintLayout } from '../../types/printLayout';
import { PrintSet } from '../../types/printSet';
import { Booklet } from '../../types/booklet';
import { Ticket } from '../../types/ticket';
import { Expense } from '../../types/expense';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error' | 'unconfigured';

type SyncListener = (status: SyncStatus, lastSyncedAt: Date | null) => void;

/**
 * Fetch all rows from a Supabase table by paginating via .range(from, to)
 * to completely bypass the default 1000-row PostgREST query limit.
 */
async function fetchAllRows<T = any>(tableName: string): Promise<T[]> {
  const PAGE_SIZE = 1000;
  let allRows: T[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .range(from, to);

    if (error) {
      // Table may not exist yet if schema was not run
      if (error.code !== '42P01') {
        console.error(`Error fetching ${tableName} (range ${from}-${to}):`, error);
      }
      break;
    }

    if (data && data.length > 0) {
      allRows.push(...(data as T[]));
      if (data.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
      }
    } else {
      hasMore = false;
    }
  }

  return allRows;
}

class SupabaseSyncService {
  private status: SyncStatus = 'synced';
  private lastSyncedAt: Date | null = null;
  private listeners: Set<SyncListener> = new Set();
  private isInitialized = false;
  private realtimeChannel: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setStatus('syncing');
        this.syncAll().catch(console.error);
      });
      window.addEventListener('offline', () => {
        this.setStatus('offline');
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status, this.lastSyncedAt);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(newStatus: SyncStatus) {
    this.status = newStatus;
    if (newStatus === 'synced') {
      this.lastSyncedAt = new Date();
    }
    this.listeners.forEach((l) => l(this.status, this.lastSyncedAt));
  }

  public getStatus(): { status: SyncStatus; lastSyncedAt: Date | null } {
    return { status: this.status, lastSyncedAt: this.lastSyncedAt };
  }

  /**
   * Test Supabase connectivity
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!isSupabaseConfigured()) {
      return { success: false, message: 'Supabase credentials not configured.' };
    }
    try {
      const { error } = await supabase.from('raffles').select('id').limit(1);
      if (error) {
        if (error.code === '42P01') {
          return {
            success: false,
            message: 'Connected to Supabase! However, the database tables need to be created using schema.sql.',
          };
        }
        return { success: false, message: `Supabase (${error.code}): ${error.message}` };
      }
      return { success: true, message: 'Successfully connected to Supabase Cloud Database!' };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Failed to connect to Supabase.' };
    }
  }

  /**
   * Initialize sync on app launch
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (!isSupabaseConfigured()) {
      this.setStatus('unconfigured');
      return;
    }

    try {
      this.setStatus('syncing');
      await this.pullFromCloud();
      await this.pushLocalToCloud();
      this.setupRealtime();
      this.setStatus('synced');
    } catch (err) {
      console.warn('Initial Supabase sync deferred:', err);
      this.setStatus('offline');
    }
  }

  /**
   * Full bidirectional synchronization
   */
  public async syncAll(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    this.setStatus('syncing');
    try {
      await this.pushLocalToCloud();
      await this.pullFromCloud();
      this.setStatus('synced');
    } catch (err) {
      console.error('Sync failed:', err);
      this.setStatus('error');
      throw err;
    }
  }

  /**
   * Push local data to Supabase in chunked batches
   */
  public async pushLocalToCloud(): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      // 1. Raffles
      const localRaffles = storageAdapter.get<Raffle[]>(STORAGE_KEYS.RAFFLES, []);
      if (localRaffles.length > 0) {
        const payload = localRaffles.map((r) => ({
          id: r.id,
          event_name: r.eventName,
          raffle_name: r.raffleName,
          ticket_name: r.ticketName,
          ticket_amount: r.ticketAmount,
          draw_date: r.drawDate,
          draw_time: r.drawTime || null,
          venue: r.venue || null,
          status: r.status,
          description: r.description || '',
          managers: r.managers || [],
          created_at: r.createdAt,
          updated_at: r.updatedAt,
        }));
        for (let i = 0; i < payload.length; i += 500) {
          await supabase.from('raffles').upsert(payload.slice(i, i + 500), { onConflict: 'id' });
        }
      }

      // 2. Ticket Designs
      const localDesigns = storageAdapter.get<TicketDesign[]>(STORAGE_KEYS.DESIGNS, []);
      if (localDesigns.length > 0) {
        const payload = localDesigns.map((d) => ({
          id: d.id,
          raffle_id: d.raffleId,
          name: d.name,
          width_mm: d.widthMm,
          height_mm: d.heightMm,
          background_image_url: d.backgroundImageUrl || '',
          background_color: d.backgroundColor || '#FFFFFF',
          elements: d.elements || [],
          version: d.version || 1,
          created_at: d.createdAt,
          updated_at: d.updatedAt,
        }));
        for (let i = 0; i < payload.length; i += 500) {
          await supabase.from('ticket_designs').upsert(payload.slice(i, i + 500), { onConflict: 'id' });
        }
      }

      // 3. Print Layouts
      const localLayouts = storageAdapter.get<PrintLayout[]>(STORAGE_KEYS.PRINT_LAYOUTS, []);
      if (localLayouts.length > 0) {
        const payload = localLayouts.map((l) => ({
          id: l.id,
          raffle_id: l.raffleId,
          paper_size: l.paperSize,
          orientation: l.orientation,
          margins: l.margins,
          ticket_width_mm: l.ticketWidthMm,
          ticket_height_mm: l.ticketHeightMm,
          tickets_per_row: l.ticketsPerRow,
          rows_per_page: l.rowsPerPage,
          vertical_gap_mm: l.verticalGapMm,
          horizontal_gap_mm: l.horizontalGapMm,
          show_crop_marks: l.showCropMarks,
          show_ticket_borders: l.showTicketBorders,
          show_page_numbers: l.showPageNumbers,
          show_booklet_number: l.showBookletNumber,
          show_print_guides: l.showPrintGuides ?? true,
          calibration: l.calibration,
        }));
        for (let i = 0; i < payload.length; i += 500) {
          await supabase.from('print_layouts').upsert(payload.slice(i, i + 500), { onConflict: 'id' });
        }
      }

      // 4. Print Sets
      const localSets = storageAdapter.get<PrintSet[]>(STORAGE_KEYS.PRINT_SETS, []);
      if (localSets.length > 0) {
        const payload = localSets.map((s) => ({
          id: s.id,
          raffle_id: s.raffleId,
          set_number: s.setNumber,
          starting_ticket_number: s.startingTicketNumber,
          ending_ticket_number: s.endingTicketNumber,
          starting_sequence: s.startingSequence,
          ending_sequence: s.endingSequence,
          tickets_per_booklet: s.ticketsPerBooklet,
          total_booklets: s.totalBooklets,
          total_tickets: s.totalTickets,
          total_pages: s.totalPages,
          booklets_per_row: s.bookletsPerRow,
          status: s.status,
          created_at: s.createdAt,
        }));
        for (let i = 0; i < payload.length; i += 500) {
          await supabase.from('print_sets').upsert(payload.slice(i, i + 500), { onConflict: 'id' });
        }
      }

      // 5. Booklets
      const localBooklets = storageAdapter.get<Booklet[]>(STORAGE_KEYS.BOOKLETS, []);
      if (localBooklets.length > 0) {
        for (let i = 0; i < localBooklets.length; i += 500) {
          const chunk = localBooklets.slice(i, i + 500).map((b) => ({
            id: b.id,
            print_set_id: b.printSetId,
            raffle_id: b.raffleId,
            booklet_number: b.bookletNumber,
            starting_ticket_number: b.startTicketNumber,
            ending_ticket_number: b.endTicketNumber,
            starting_sequence: b.startSequence,
            ending_sequence: b.endSequence,
            total_tickets: b.totalTickets,
            status: b.status,
            solicitor_name: b.solicitorName || null,
            buyer_name: b.buyerName || null,
            created_at: b.createdAt,
          }));
          await supabase.from('booklets').upsert(chunk, { onConflict: 'id' });
        }
      }

      // 6. Tickets (Chunked in batches of 500 to support 10,000+ tickets smoothly)
      const localTickets = storageAdapter.get<Ticket[]>(STORAGE_KEYS.TICKETS, []);
      if (localTickets.length > 0) {
        for (let i = 0; i < localTickets.length; i += 500) {
          const chunk = localTickets.slice(i, i + 500).map((t) => ({
            id: t.id,
            print_set_id: t.printSetId,
            booklet_id: t.bookletId,
            raffle_id: t.raffleId,
            ticket_number: t.ticketNumber,
            ticket_sequence: t.ticketSequence,
            qr_value: t.qrValue,
            amount: t.amount,
            status: t.status,
            buyer_name: t.buyerName || null,
            solicitor_name: t.solicitorName || null,
            created_at: t.createdAt,
            assigned_at: t.assignedAt || null,
            sold_at: t.soldAt || null,
            used_at: t.usedAt || null,
          }));
          await supabase.from('tickets').upsert(chunk, { onConflict: 'id' });
        }
      }

      // 7. Expenses
      const localExpenses = storageAdapter.get<Expense[]>(STORAGE_KEYS.EXPENSES, []);
      if (localExpenses.length > 0) {
        const payload = localExpenses.map((e) => ({
          id: e.id,
          raffle_id: e.raffleId,
          title: e.title,
          amount: e.amount,
          category: e.category,
          date: e.date,
          receipt_number: e.receiptNumber || null,
          notes: e.notes || '',
          recorded_by: e.recordedBy || null,
          created_at: e.createdAt,
          updated_at: e.updatedAt,
        }));
        for (let i = 0; i < payload.length; i += 500) {
          await supabase.from('expenses').upsert(payload.slice(i, i + 500), { onConflict: 'id' });
        }
      }
    } catch (err) {
      console.error('Error pushing data to Supabase:', err);
      throw err;
    }
  }

  /**
   * Pull all cloud tables without any 1000-row limit using paginated range fetching
   */
  public async pullFromCloud(): Promise<void> {
    if (!isSupabaseConfigured()) return;

    try {
      // 1. Raffles (unlimited)
      const raffles = await fetchAllRows<any>('raffles');
      if (raffles.length > 0) {
        const mapped: Raffle[] = raffles.map((r) => ({
          id: r.id,
          eventName: r.event_name,
          raffleName: r.raffle_name,
          ticketName: r.ticket_name || 'General Admission',
          ticketAmount: Number(r.ticket_amount),
          drawDate: r.draw_date,
          drawTime: r.draw_time || undefined,
          venue: r.venue || undefined,
          status: r.status,
          description: r.description || undefined,
          managers: r.managers || [],
          createdAt: r.created_at,
          updatedAt: r.updated_at,
        }));
        storageAdapter.set(STORAGE_KEYS.RAFFLES, mapped);
      }

      // 2. Ticket Designs (unlimited)
      const designs = await fetchAllRows<any>('ticket_designs');
      if (designs.length > 0) {
        const mapped: TicketDesign[] = designs.map((d) => ({
          id: d.id,
          raffleId: d.raffle_id,
          name: d.name,
          widthMm: Number(d.width_mm),
          heightMm: Number(d.height_mm),
          backgroundImageUrl: d.background_image_url,
          backgroundColor: d.background_color,
          elements: d.elements || [],
          version: d.version,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        }));
        storageAdapter.set(STORAGE_KEYS.DESIGNS, mapped);
      }

      // 3. Print Layouts (unlimited)
      const layouts = await fetchAllRows<any>('print_layouts');
      if (layouts.length > 0) {
        const mapped: PrintLayout[] = layouts.map((l) => ({
          id: l.id,
          raffleId: l.raffle_id,
          paperSize: l.paper_size,
          orientation: l.orientation,
          margins: l.margins,
          ticketWidthMm: Number(l.ticket_width_mm),
          ticketHeightMm: Number(l.ticket_height_mm),
          ticketsPerRow: l.tickets_per_row,
          rowsPerPage: l.rows_per_page,
          verticalGapMm: Number(l.vertical_gap_mm),
          horizontalGapMm: Number(l.horizontal_gap_mm),
          showCropMarks: l.show_crop_marks,
          showTicketBorders: l.show_ticket_borders,
          showPageNumbers: l.show_page_numbers,
          showBookletNumber: l.show_booklet_number,
          showPrintGuides: l.show_print_guides ?? true,
          calibration: l.calibration,
        }));
        storageAdapter.set(STORAGE_KEYS.PRINT_LAYOUTS, mapped);
      }

      // 4. Print Sets (unlimited)
      const sets = await fetchAllRows<any>('print_sets');
      if (sets.length > 0) {
        const mapped: PrintSet[] = sets.map((s) => ({
          id: s.id,
          raffleId: s.raffle_id,
          setNumber: s.set_number,
          startingTicketNumber: s.starting_ticket_number,
          endingTicketNumber: s.ending_ticket_number,
          startingSequence: s.starting_sequence,
          endingSequence: s.ending_sequence,
          ticketsPerBooklet: s.tickets_per_booklet,
          totalBooklets: s.total_booklets,
          totalTickets: s.total_tickets,
          totalPages: s.total_pages || s.tickets_per_booklet,
          bookletsPerRow: s.booklets_per_row,
          status: s.status,
          createdAt: s.created_at,
        }));
        storageAdapter.set(STORAGE_KEYS.PRINT_SETS, mapped);
      }

      // 5. Booklets (unlimited - bypasses 1000 limit)
      const booklets = await fetchAllRows<any>('booklets');
      if (booklets.length > 0) {
        const mapped: Booklet[] = booklets.map((b) => ({
          id: b.id,
          printSetId: b.print_set_id,
          raffleId: b.raffle_id,
          bookletNumber: b.booklet_number,
          startTicketNumber: b.starting_ticket_number,
          endTicketNumber: b.ending_ticket_number,
          startSequence: b.starting_sequence,
          endSequence: b.ending_sequence,
          totalTickets: b.total_tickets,
          status: b.status,
          solicitorName: b.solicitor_name || undefined,
          buyerName: b.buyer_name || undefined,
          createdAt: b.created_at,
        }));
        storageAdapter.set(STORAGE_KEYS.BOOKLETS, mapped);
      }

      // 6. Tickets (unlimited - bypasses 1000 limit)
      const tickets = await fetchAllRows<any>('tickets');
      if (tickets.length > 0) {
        const mapped: Ticket[] = tickets.map((t) => ({
          id: t.id,
          printSetId: t.print_set_id,
          bookletId: t.booklet_id,
          raffleId: t.raffle_id,
          ticketNumber: t.ticket_number,
          ticketSequence: t.ticket_sequence,
          qrValue: t.qr_value,
          amount: Number(t.amount) || 0,
          status: t.status,
          buyerName: t.buyer_name || undefined,
          solicitorName: t.solicitor_name || undefined,
          createdAt: t.created_at,
          assignedAt: t.assigned_at || undefined,
          soldAt: t.sold_at || undefined,
          usedAt: t.used_at || undefined,
        }));
        storageAdapter.set(STORAGE_KEYS.TICKETS, mapped);
      }

      // 7. Expenses (unlimited)
      const expenses = await fetchAllRows<any>('expenses');
      if (expenses.length > 0) {
        const mapped: Expense[] = expenses.map((e) => ({
          id: e.id,
          raffleId: e.raffle_id,
          title: e.title,
          amount: Number(e.amount),
          category: e.category,
          date: e.date,
          receiptNumber: e.receipt_number || undefined,
          notes: e.notes || undefined,
          recordedBy: e.recorded_by || undefined,
          createdAt: e.created_at,
          updatedAt: e.updated_at,
        }));
        storageAdapter.set(STORAGE_KEYS.EXPENSES, mapped);
      }
    } catch (err) {
      console.error('Error pulling data from Supabase:', err);
      throw err;
    }
  }

  /**
   * Setup Supabase Realtime subscriptions
   */
  private setupRealtime() {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }

    try {
      this.realtimeChannel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'raffles' },
          () => this.pullFromCloud().catch(console.error)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'booklets' },
          () => this.pullFromCloud().catch(console.error)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tickets' },
          () => this.pullFromCloud().catch(console.error)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'expenses' },
          () => this.pullFromCloud().catch(console.error)
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'print_sets' },
          () => this.pullFromCloud().catch(console.error)
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime channel subscription error:', err);
    }
  }
}

export const supabaseSyncService = new SupabaseSyncService();
