import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { expensesRepository } from '../services/storage/expensesRepository';
import { ticketFormatter } from '../services/tickets/ticketFormatter';
import { Ticket } from '../types/ticket';
import { Booklet } from '../types/booklet';
import { Raffle } from '../types/raffle';
import { Expense, ExpenseCategory, EXPENSE_CATEGORIES } from '../types/expense';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { TicketDetailModal } from '../components/tickets/TicketDetailModal';
import { TicketMarkSoldModal } from '../components/tickets/TicketMarkSoldModal';
import { ExpenseModal } from '../components/expenses/ExpenseModal';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp,
  DollarSign,
  Ticket as TicketIcon,
  Users,
  BookOpen,
  Search,
  Download,
  Calendar,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Filter,
  Receipt,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  AlertTriangle,
  PieChart,
} from 'lucide-react';

export const SalesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const isManager = user?.role === 'manager';
  const initialRaffleId = searchParams.get('raffleId') || user?.raffleId || 'all';

  const [selectedRaffleId, setSelectedRaffleId] = useState<string>(
    isManager && user?.raffleId ? user.raffleId : initialRaffleId
  );
  const [activeTab, setActiveTab] = useState<'register' | 'solicitors' | 'booklets' | 'expenses'>('register');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSolicitor, setSelectedSolicitor] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modals state
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [soldTicketIds, setSoldTicketIds] = useState<string[]>([]);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const loadData = () => setRefreshKey((k) => k + 1);

  const raffles = useMemo(() => rafflesRepository.getAll(), [refreshKey]);
  const tickets = useMemo(() => ticketsRepository.getAll(), [selectedTicket, soldTicketIds, refreshKey]);
  const booklets = useMemo(() => bookletsRepository.getAll(), [selectedTicket, soldTicketIds, refreshKey]);
  const expenses = useMemo(() => expensesRepository.getAll(), [refreshKey]);

  const activeRaffle = useMemo<Raffle | null>(() => {
    if (selectedRaffleId === 'all') return null;
    return raffles.find((r) => r.id === selectedRaffleId) || null;
  }, [raffles, selectedRaffleId]);

  // Scoped data by selected raffle
  const scopedTickets = useMemo(() => {
    if (selectedRaffleId === 'all') return tickets;
    return tickets.filter((t) => t.raffleId === selectedRaffleId);
  }, [tickets, selectedRaffleId]);

  const scopedBooklets = useMemo(() => {
    if (selectedRaffleId === 'all') return booklets;
    return booklets.filter((b) => b.raffleId === selectedRaffleId);
  }, [booklets, selectedRaffleId]);

  const scopedExpenses = useMemo(() => {
    if (selectedRaffleId === 'all') return expenses;
    return expenses.filter((e) => e.raffleId === selectedRaffleId);
  }, [expenses, selectedRaffleId]);

  // Sold & Admitted tickets (sales count)
  const soldTickets = useMemo(() => {
    return scopedTickets.filter((t) => t.status === 'sold' || t.status === 'used');
  }, [scopedTickets]);

  // Financial Metrics
  const totalSalesRevenue = useMemo(() => {
    return soldTickets.reduce((sum, t) => {
      const raffle = raffles.find((r) => r.id === t.raffleId);
      return sum + (raffle?.ticketAmount || 0);
    }, 0);
  }, [soldTickets, raffles]);

  const totalPotentialRevenue = useMemo(() => {
    return scopedTickets.reduce((sum, t) => {
      const raffle = raffles.find((r) => r.id === t.raffleId);
      return sum + (raffle?.ticketAmount || 0);
    }, 0);
  }, [scopedTickets, raffles]);

  const totalExpenses = useMemo(() => {
    return scopedExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [scopedExpenses]);

  const netProfit = totalSalesRevenue - totalExpenses;
  const profitMargin = totalSalesRevenue > 0 ? Math.round((netProfit / totalSalesRevenue) * 100) : 0;

  const sellThroughRate = scopedTickets.length > 0
    ? Math.round((soldTickets.length / scopedTickets.length) * 100)
    : 0;

  // Unique solicitors
  const solicitorsList = useMemo(() => {
    const set = new Set<string>();
    scopedTickets.forEach((t) => {
      if (t.solicitorName) set.add(t.solicitorName);
    });
    scopedBooklets.forEach((b) => {
      if (b.solicitorName) set.add(b.solicitorName);
    });
    return Array.from(set).sort();
  }, [scopedTickets, scopedBooklets]);

  // Solicitor stats breakdown
  const solicitorStats = useMemo(() => {
    const map = new Map<string, { totalAssigned: number; soldCount: number; revenue: number; bookletCount: number }>();

    solicitorsList.forEach((sol) => {
      map.set(sol, { totalAssigned: 0, soldCount: 0, revenue: 0, bookletCount: 0 });
    });

    scopedTickets.forEach((t) => {
      const sol = t.solicitorName;
      if (sol && map.has(sol)) {
        const item = map.get(sol)!;
        item.totalAssigned += 1;
        if (t.status === 'sold' || t.status === 'used') {
          item.soldCount += 1;
          const raffle = raffles.find((r) => r.id === t.raffleId);
          item.revenue += raffle?.ticketAmount || 0;
        }
      }
    });

    scopedBooklets.forEach((b) => {
      const sol = b.solicitorName;
      if (sol && map.has(sol)) {
        map.get(sol)!.bookletCount += 1;
      }
    });

    return Array.from(map.entries()).map(([name, stat]) => ({
      name,
      ...stat,
    })).sort((a, b) => b.revenue - a.revenue || b.soldCount - a.soldCount);
  }, [solicitorsList, scopedTickets, scopedBooklets, raffles]);

  // Filtered sold tickets
  const filteredSoldTickets = useMemo(() => {
    return soldTickets.filter((t) => {
      if (selectedSolicitor !== 'all' && t.solicitorName !== selectedSolicitor) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const bk = booklets.find((b) => b.id === t.bookletId);
        const matchNumber = t.ticketNumber.toLowerCase().includes(query);
        const matchBuyer = (t.buyerName || '').toLowerCase().includes(query);
        const matchSolicitor = (t.solicitorName || '').toLowerCase().includes(query);
        const matchBooklet = bk ? String(bk.bookletNumber).includes(query) : false;
        return matchNumber || matchBuyer || matchSolicitor || matchBooklet;
      }
      return true;
    });
  }, [soldTickets, selectedSolicitor, searchQuery, booklets]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return scopedExpenses.filter((e) => {
      if (selectedCategory !== 'all' && e.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(query);
        const matchReceipt = (e.receiptNumber || '').toLowerCase().includes(query);
        const matchNotes = (e.notes || '').toLowerCase().includes(query);
        return matchTitle || matchReceipt || matchNotes;
      }
      return true;
    });
  }, [scopedExpenses, selectedCategory, searchQuery]);

  // Expenses category breakdown
  const categoryBreakdown = useMemo(() => {
    const map: Record<ExpenseCategory, number> = {
      printing: 0,
      prizes: 0,
      marketing: 0,
      venue: 0,
      logistics: 0,
      commission: 0,
      other: 0,
    };

    scopedExpenses.forEach((e) => {
      if (map[e.category] !== undefined) {
        map[e.category] += e.amount;
      } else {
        map.other += e.amount;
      }
    });

    return map;
  }, [scopedExpenses]);

  // Export Sold Tickets CSV
  const handleExportSalesCsv = () => {
    if (filteredSoldTickets.length === 0) {
      toast.warning('No sales records to export.');
      return;
    }

    const headers = ['Ticket Number', 'Booklet Number', 'Event Name', 'Buyer Name', 'Solicitor', 'Amount', 'Date Sold', 'Status'];
    const rows = filteredSoldTickets.map((t) => {
      const raffle = raffles.find((r) => r.id === t.raffleId);
      const bk = booklets.find((b) => b.id === t.bookletId);
      return [
        `"${t.ticketNumber}"`,
        `"${bk ? `B#${String(bk.bookletNumber).padStart(3, '0')}` : '-'}"`,
        `"${raffle?.raffleName || '-'}"`,
        `"${t.buyerName || '-'}"`,
        `"${t.solicitorName || '-'}"`,
        raffle?.ticketAmount || 0,
        `"${t.soldAt ? new Date(t.soldAt).toLocaleDateString() : '-'}"`,
        `"${t.status}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${filteredSoldTickets.length} sales records to CSV.`);
  };

  // Export Complete Financial & Expense Summary CSV
  const handleExportFinancialReportCsv = () => {
    const reportTitle = [
      `"RAFFLE PRO - FINANCIAL & SALES REPORT"`,
      `"Generated At: ${new Date().toLocaleString()}"`,
      `"Event Scope: ${activeRaffle ? activeRaffle.raffleName : 'All Events'}"`,
      '',
      `"FINANCIAL SUMMARY"`,
      `"Gross Sales Revenue",${totalSalesRevenue}`,
      `"Total Expenses",${totalExpenses}`,
      `"Net Profit / Proceeds",${netProfit}`,
      `"Profit Margin %",${profitMargin}%`,
      `"Tickets Sold",${soldTickets.length}`,
      `"Total Tickets",${scopedTickets.length}`,
      '',
      `"EXPENSES BREAKDOWN"`,
      `"Date","Category","Title / Description","Event","Receipt / Ref #","Amount ($)"`,
    ];

    const expenseRows = scopedExpenses.map((e) => {
      const raffle = raffles.find((r) => r.id === e.raffleId);
      return [
        `"${e.date ? new Date(e.date).toLocaleDateString() : '-'}"`,
        `"${e.category}"`,
        `"${e.title.replace(/"/g, '""')}"`,
        `"${raffle?.raffleName || '-'}"`,
        `"${e.receiptNumber || '-'}"`,
        e.amount,
      ].join(',');
    });

    const fullCsv = reportTitle.concat(expenseRows).join('\n');
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + fullCsv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `financial_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Financial & Expense Summary Report exported to CSV.');
  };

  const handleDeleteExpenseConfirm = () => {
    if (!deletingExpense) return;
    expensesRepository.delete(deletingExpense.id);
    toast.success(`Expense "${deletingExpense.title}" deleted.`);
    setDeletingExpense(null);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
              Ticket Sales & Financial Tracker
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Real-time gross sales, event expenses, net profit, and solicitor performance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Event selector (Admins can toggle, managers locked) */}
          {!isManager && raffles.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-neutral-500 font-semibold">Event:</span>
              <select
                value={selectedRaffleId}
                onChange={(e) => setSelectedRaffleId(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                <option value="all">All Raffle Events ({tickets.length} tickets)</option>
                {raffles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.raffleName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportFinancialReportCsv}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Financial Report CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSalesCsv}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Sales CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setSelectedExpense(null);
              setIsExpenseModalOpen(true);
            }}
            className="bg-[#F97316] hover:bg-[#ea580c]"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Record Expense
          </Button>
        </div>
      </div>

      {/* Financial KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Gross Revenue */}
        <Card className="p-4 bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border-emerald-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              Gross Sales
            </span>
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-950 mt-1">
            {ticketFormatter.formatCurrency(totalSalesRevenue)}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1 font-medium">
            of {ticketFormatter.formatCurrency(totalPotentialRevenue)} pot.
          </div>
        </Card>

        {/* Total Expenses */}
        <Card className="p-4 bg-gradient-to-br from-rose-50/70 to-red-50/30 border-red-200">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="w-6 h-6 rounded-md bg-red-100 text-red-700 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-950 mt-1">
            {ticketFormatter.formatCurrency(totalExpenses)}
          </div>
          <div className="text-[11px] text-red-700 mt-1 font-medium">
            {scopedExpenses.length} expense item{scopedExpenses.length === 1 ? '' : 's'}
          </div>
        </Card>

        {/* Net Profit / Proceeds */}
        <Card className={`p-4 border ${netProfit >= 0 ? 'bg-gradient-to-br from-amber-50/70 to-orange-50/30 border-orange-200' : 'bg-red-50/70 border-red-300'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${netProfit >= 0 ? 'text-[#c2410c]' : 'text-red-800'}`}>
              Net Proceeds
            </span>
            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${netProfit >= 0 ? 'bg-orange-100 text-[#ea580c]' : 'bg-red-100 text-red-700'}`}>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl font-black mt-1 ${netProfit >= 0 ? 'text-neutral-900' : 'text-red-600'}`}>
            {ticketFormatter.formatCurrency(netProfit)}
          </div>
          <div className="text-[11px] text-neutral-600 mt-1 font-medium">
            {profitMargin}% profit margin
          </div>
        </Card>

        {/* Tickets Sold */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Tickets Sold
            </span>
            <div className="w-6 h-6 rounded-md bg-orange-100 text-[#ea580c] flex items-center justify-center">
              <TicketIcon className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
            {soldTickets.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-medium flex items-center gap-1.5">
            <div className="w-14 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F97316] rounded-full"
                style={{ width: `${Math.min(100, sellThroughRate)}%` }}
              />
            </div>
            <span>{sellThroughRate}%</span>
          </div>
        </Card>

        {/* Active Solicitors */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Solicitors
            </span>
            <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
            {solicitorsList.length}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 font-medium">
            {scopedBooklets.filter((b) => b.solicitorName).length} bk. assigned
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E5E5E5] flex items-center gap-2 text-xs font-semibold select-none overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab('register');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'register'
              ? 'border-[#F97316] text-[#ea580c] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <TicketIcon className="w-4 h-4" />
          <span>Sold Tickets Ledger ({soldTickets.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('solicitors');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'solicitors'
              ? 'border-[#F97316] text-[#ea580c] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Solicitor Breakdown ({solicitorStats.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('booklets');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'booklets'
              ? 'border-[#F97316] text-[#ea580c] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Booklet Progress ({scopedBooklets.length})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('expenses');
            setSearchQuery('');
          }}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'expenses'
              ? 'border-[#F97316] text-[#ea580c] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Expenses & Outflows ({scopedExpenses.length})</span>
          {totalExpenses > 0 && (
            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded-full">
              {ticketFormatter.formatCurrency(totalExpenses)}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: Sold Tickets Ledger */}
      {activeTab === 'register' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by ticket #, buyer name, or solicitor..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] text-neutral-900"
              />
            </div>

            {solicitorsList.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-neutral-500 font-semibold whitespace-nowrap">
                  Solicitor:
                </span>
                <select
                  value={selectedSolicitor}
                  onChange={(e) => setSelectedSolicitor(e.target.value)}
                  className="px-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                >
                  <option value="all">All Solicitors</option>
                  {solicitorsList.map((sol) => (
                    <option key={sol} value={sol}>
                      {sol}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {filteredSoldTickets.length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-8 h-8" />}
              title="No sold tickets found"
              description={searchQuery ? 'Try modifying your search filter.' : 'Tickets marked as Sold or Used will appear in this ledger.'}
            />
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-[#E5E5E5] text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Ticket #</th>
                      <th className="py-3 px-4">Booklet</th>
                      <th className="py-3 px-4">Buyer Name</th>
                      <th className="py-3 px-4">Solicitor</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Sold At</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {filteredSoldTickets.map((t) => {
                      const raffle = raffles.find((r) => r.id === t.raffleId);
                      return (
                        <tr key={t.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                            {t.ticketNumber}
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-600">
                            {(() => {
                              const bk = booklets.find((b) => b.id === t.bookletId);
                              return bk ? `B#${String(bk.bookletNumber).padStart(3, '0')}` : '—';
                            })()}
                          </td>
                          <td className="py-3 px-4 font-semibold text-neutral-900">
                            {t.buyerName || '—'}
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            {t.solicitorName || '—'}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#F97316]">
                            {ticketFormatter.formatCurrency(raffle?.ticketAmount || 0)}
                          </td>
                          <td className="py-3 px-4 text-neutral-500">
                            {t.soldAt ? new Date(t.soldAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge status={t.status}>{t.status}</Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTicket(t)}
                              className="text-neutral-500 hover:text-neutral-900"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Solicitor Breakdown */}
      {activeTab === 'solicitors' && (
        <div className="space-y-4">
          {solicitorStats.length === 0 ? (
            <EmptyState
              icon={<Users className="w-8 h-8" />}
              title="No solicitors assigned"
              description="Assign booklets or tickets to solicitors to track their sales performance."
            />
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-[#E5E5E5] text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Solicitor Name</th>
                      <th className="py-3 px-4">Booklets</th>
                      <th className="py-3 px-4">Assigned Tickets</th>
                      <th className="py-3 px-4">Sold Tickets</th>
                      <th className="py-3 px-4">Conversion</th>
                      <th className="py-3 px-4 text-right">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {solicitorStats.map((stat, idx) => {
                      const conversion = stat.totalAssigned > 0
                        ? Math.round((stat.soldCount / stat.totalAssigned) * 100)
                        : 0;

                      return (
                        <tr key={stat.name} className="hover:bg-neutral-50 transition-colors">
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-bold text-[10px] ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800'
                                : idx === 1
                                ? 'bg-neutral-200 text-neutral-800'
                                : idx === 2
                                ? 'bg-orange-100 text-orange-800'
                                : 'text-neutral-400'
                            }`}>
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-900">
                            {stat.name}
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            {stat.bookletCount} booklet(s)
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            {stat.totalAssigned}
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-700">
                            {stat.soldCount}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-emerald-500 rounded-full"
                                  style={{ width: `${Math.min(100, conversion)}%` }}
                                />
                              </div>
                              <span className="font-semibold text-neutral-700">{conversion}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-[#F97316]">
                            {ticketFormatter.formatCurrency(stat.revenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Booklet Progress */}
      {activeTab === 'booklets' && (
        <div className="space-y-4">
          {scopedBooklets.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-8 h-8" />}
              title="No booklets found"
              description="Generate ticket sets to create booklets."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {scopedBooklets.map((b) => {
                const bookletTickets = scopedTickets.filter((t) => t.bookletId === b.id);
                const soldInBooklet = bookletTickets.filter((t) => t.status === 'sold' || t.status === 'used').length;
                const progress = bookletTickets.length > 0 ? Math.round((soldInBooklet / bookletTickets.length) * 100) : 0;
                const raffle = raffles.find((r) => r.id === b.raffleId);
                const salesAmt = soldInBooklet * (raffle?.ticketAmount || 0);

                return (
                  <Card key={b.id} className="p-4 space-y-3 hover:border-orange-300 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="font-mono font-black text-sm text-neutral-900">
                        Booklet #{String(b.bookletNumber).padStart(3, '0')}
                      </div>
                      <Badge status={b.status}>{b.status}</Badge>
                    </div>

                    <div className="text-xs text-neutral-500">
                      Range: <strong className="text-neutral-700">{b.startTicketNumber} – {b.endTicketNumber}</strong>
                    </div>

                    <div className="text-xs text-neutral-500">
                      Solicitor: <strong className="text-neutral-800">{b.solicitorName || 'Unassigned'}</strong>
                    </div>

                    <div className="pt-2 border-t border-[#E5E5E5] space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-500">Progress:</span>
                        <span className="font-bold text-neutral-900">
                          {soldInBooklet} / {bookletTickets.length} Sold ({progress}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-neutral-500">Sales Generated:</span>
                        <span className="font-black text-[#F97316]">
                          {ticketFormatter.formatCurrency(salesAmt)}
                        </span>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Expenses & Outflows */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Top Category Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {EXPENSE_CATEGORIES.map((cat) => {
              const catAmount = categoryBreakdown[cat.value] || 0;
              const isSelected = selectedCategory === cat.value;
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.value)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-orange-50 border-[#F97316] ring-1 ring-[#F97316]'
                      : 'bg-white border-[#E5E5E5] hover:border-neutral-300'
                  }`}
                >
                  <p className="text-[10px] font-semibold text-neutral-500 truncate">{cat.label}</p>
                  <p className="text-xs font-black text-neutral-900 mt-0.5">
                    {ticketFormatter.formatCurrency(catAmount)}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Action and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search expense description, receipt #, or notes..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316] text-neutral-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setSelectedExpense(null);
                  setIsExpenseModalOpen(true);
                }}
                className="bg-[#F97316] hover:bg-[#ea580c] whitespace-nowrap"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Expense
              </Button>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <EmptyState
              icon={<Receipt className="w-8 h-8" />}
              title="No expenses recorded"
              description={searchQuery || selectedCategory !== 'all' ? 'Try adjusting your filters.' : 'Record supplies, printing costs, prize purchases, or marketing expenses to track net profit.'}
            />
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-[#E5E5E5] text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description / Title</th>
                      <th className="py-3 px-4">Category</th>
                      {!activeRaffle && <th className="py-3 px-4">Event</th>}
                      <th className="py-3 px-4">Receipt / Ref #</th>
                      <th className="py-3 px-4">Notes</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {filteredExpenses.map((exp) => {
                      const raffle = raffles.find((r) => r.id === exp.raffleId);
                      const catMeta = EXPENSE_CATEGORIES.find((c) => c.value === exp.category);
                      return (
                        <tr key={exp.id} className="hover:bg-red-50/20 transition-colors">
                          <td className="py-3 px-4 text-neutral-600 font-medium">
                            {exp.date ? new Date(exp.date).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-900">
                            {exp.title}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${catMeta?.color || 'bg-neutral-100 text-neutral-700'}`}>
                              {catMeta?.label || exp.category}
                            </span>
                          </td>
                          {!activeRaffle && (
                            <td className="py-3 px-4 text-neutral-600">
                              {raffle?.raffleName || '—'}
                            </td>
                          )}
                          <td className="py-3 px-4 font-mono text-neutral-500">
                            {exp.receiptNumber || '—'}
                          </td>
                          <td className="py-3 px-4 text-neutral-500 max-w-xs truncate">
                            {exp.notes || '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-red-600 text-sm">
                            {ticketFormatter.formatCurrency(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedExpense(exp);
                                  setIsExpenseModalOpen(true);
                                }}
                                className="text-neutral-500 hover:text-neutral-900 p-1.5"
                                title="Edit Expense"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingExpense(exp)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-50 border-t-2 border-[#E5E5E5] font-bold text-xs">
                      <td colSpan={!activeRaffle ? 5 : 4} className="py-3 px-4 text-neutral-700 uppercase tracking-wider text-[11px]">
                        Total Filtered Expenses ({filteredExpenses.length} items)
                      </td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-right font-black text-red-600 text-base">
                        {ticketFormatter.formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdated={loadData}
      />

      {/* Mark Sold Modal */}
      <TicketMarkSoldModal
        selectedTicketIds={soldTicketIds}
        isOpen={soldTicketIds.length > 0}
        onClose={() => setSoldTicketIds([])}
        onSaved={loadData}
      />

      {/* Expense Modal (Add / Edit) */}
      <ExpenseModal
        expense={selectedExpense}
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setSelectedExpense(null);
        }}
        onSaved={loadData}
        defaultRaffleId={selectedRaffleId}
        raffles={raffles}
      />

      {/* Delete Expense Confirmation Modal */}
      {deletingExpense && (
        <Modal
          isOpen={!!deletingExpense}
          onClose={() => setDeletingExpense(null)}
          title="Delete Expense Record"
          description={`Are you sure you want to permanently delete the expense "${deletingExpense.title}" of ${ticketFormatter.formatCurrency(deletingExpense.amount)}?`}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>This will adjust your financial summary and increase your recorded net profit.</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
              <Button variant="outline" size="sm" onClick={() => setDeletingExpense(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-red-600 hover:bg-red-700 border-red-700"
                onClick={handleDeleteExpenseConfirm}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Expense
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
