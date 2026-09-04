import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { printSetsRepository } from '../services/storage/printSetsRepository';
import { designRepository } from '../services/storage/designRepository';
import { storageAdapter } from '../services/storage/storageAdapter';
import { ticketFormatter } from '../services/tickets/ticketFormatter';
import { Raffle } from '../types/raffle';
import { Ticket, TicketStatus } from '../types/ticket';
import { Booklet } from '../types/booklet';
import { PrintSet } from '../types/printSet';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input, Select } from '../components/ui/Input';
import { BookletCard } from '../components/booklets/BookletCard';
import { BookletTable } from '../components/booklets/BookletTable';
import { BookletAssignModal } from '../components/booklets/BookletAssignModal';
import { BookletMarkSoldModal } from '../components/booklets/BookletMarkSoldModal';
import { TicketTable } from '../components/tickets/TicketTable';
import { TicketDetailModal } from '../components/tickets/TicketDetailModal';
import { BulkAssignModal } from '../components/tickets/BulkAssignModal';
import { TicketMarkSoldModal } from '../components/tickets/TicketMarkSoldModal';
import { PrintSetTable } from '../components/sets/PrintSetTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import {
  Trophy,
  Palette,
  Sparkles,
  BookOpen,
  Ticket as TicketIcon,
  Printer,
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  ChevronRight,
  Eye,
  CheckCircle2,
  Users,
  Settings as SettingsIcon,
  Mail,
  Copy,
  ExternalLink,
  UserPlus,
  Trash2,
  TrendingUp,
  DollarSign,
  Share2,
  Check,
  ShieldCheck,
} from 'lucide-react';

export const RaffleDetailPage: React.FC = () => {
  const { raffleId } = useParams<{ raffleId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'booklets' | 'tickets' | 'printSets' | 'sales' | 'settings'>('overview');
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [booklets, setBooklets] = useState<Booklet[]>([]);
  const [printSets, setPrintSets] = useState<PrintSet[]>([]);
  const [newManagerEmail, setNewManagerEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Sync tab with location hash
  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (['overview', 'booklets', 'tickets', 'printSets', 'sales', 'settings'].includes(hash)) {
      setActiveTab(hash as any);
    }
  }, [window.location.hash]);

  // Modals state
  const [selectedBooklet, setSelectedBooklet] = useState<Booklet | null>(null);
  const [soldBooklet, setSoldBooklet] = useState<Booklet | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [bulkAssignTicketIds, setBulkAssignTicketIds] = useState<string[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkSoldTicketIds, setBulkSoldTicketIds] = useState<string[]>([]);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);

  const loadRaffleData = () => {
    if (!raffleId) return;
    const r = rafflesRepository.getById(raffleId);
    if (!r) {
      navigate('/raffles');
      return;
    }
    setRaffle(r);
    setTickets(ticketsRepository.getAll({ raffleId }));
    setBooklets(bookletsRepository.getAll({ raffleId }));
    setPrintSets(printSetsRepository.getAll({ raffleId }));
  };

  useEffect(() => {
    loadRaffleData();
    const unsubscribe = storageAdapter.subscribe(() => {
      loadRaffleData();
    });
    return unsubscribe;
  }, [raffleId]);

  if (!raffle) return null;

  // Overview metrics
  const availableCount = tickets.filter((t) => t.status === 'available').length;
  const assignedCount = tickets.filter((t) => t.status === 'assigned').length;
  const soldCount = tickets.filter((t) => t.status === 'sold').length;
  const usedCount = tickets.filter((t) => t.status === 'used').length;
  const cancelledCount = tickets.filter((t) => t.status === 'cancelled').length;
  const totalSales = (soldCount + usedCount) * raffle.ticketAmount;

  // Workflow steps
  const hasDesign = !!designRepository.getByRaffleId(raffle.id);
  const hasTickets = tickets.length > 0;
  const hasAssignments = tickets.some((t) => t.solicitorName || t.buyerName) || booklets.some((b) => b.solicitorName);
  const hasPrinted = printSets.some((p) => p.status === 'printed');

  const workflowSteps = [
    { title: 'Create Raffle', completed: true },
    { title: 'Ticket Designer', completed: hasDesign, link: `/raffles/${raffle.id}/design` },
    { title: 'Generate Numbers', completed: hasTickets, link: `/raffles/${raffle.id}/generate` },
    { title: 'Assign Booklets', completed: hasAssignments, tab: 'booklets' },
    { title: 'Print Tickets', completed: hasPrinted, tab: 'printSets' },
    { title: 'Scan & Validate', completed: usedCount > 0, link: '/scan' },
  ];

  const handleBulkStatusChange = (ids: string[], status: TicketStatus) => {
    if (status === 'sold') {
      setBulkSoldTicketIds(ids);
      return;
    }
    const updates: Partial<Ticket> = { status };
    if (status === 'used') updates.usedAt = new Date().toISOString();
    ticketsRepository.updateMany(ids, updates);
    toast.success(`Updated ${ids.length} ticket(s) to ${status}!`);
    loadRaffleData();
  };

  const handlePrintSet = (set: PrintSet) => {
    printSetsRepository.update(set.id, { status: 'printed' });
    toast.success(`Print Set #${String(set.setNumber).padStart(3, '0')} marked as Printed! Opening preview...`);
    loadRaffleData();
    navigate(`/print-sets/${set.id}/preview`);
  };

  const handleToggleSetPrinted = (set: PrintSet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = set.status === 'printed' ? 'generated' : 'printed';
    printSetsRepository.update(set.id, { status: newStatus });
    toast.success(`Print Set #${String(set.setNumber).padStart(3, '0')} status updated to ${newStatus}.`);
    loadRaffleData();
  };

  const handleConfirmDeleteSet = () => {
    if (!deleteSetId) return;
    printSetsRepository.delete(deleteSetId);
    ticketsRepository.deleteByPrintSetId(deleteSetId);
    bookletsRepository.deleteByPrintSetId(deleteSetId);
    toast.success('Print Set and associated tickets deleted.');
    setDeleteSetId(null);
    loadRaffleData();
  };

  const handleUpdateRaffleSettings = (e: React.FormEvent) => {
    e.preventDefault();
    rafflesRepository.update(raffle.id, raffle);
    toast.success('Raffle settings saved.');
    loadRaffleData();
  };

  const handleAddManager = (e: React.FormEvent) => {
    e.preventDefault();
    const email = newManagerEmail.trim().toLowerCase();
    if (!email || !email.includes('@') || !email.includes('.')) {
      toast.error('Please enter a valid email address.');
      return;
    }

    const currentManagers = raffle.managers || [];
    if (currentManagers.map((m) => m.toLowerCase()).includes(email)) {
      toast.warning('This manager email is already added to this event.');
      return;
    }

    const updatedManagers = [...currentManagers, email];
    const updated = { ...raffle, managers: updatedManagers };
    rafflesRepository.update(raffle.id, updated);
    setRaffle(updated);
    setNewManagerEmail('');
    toast.success(`Manager ${email} added successfully!`);
  };

  const handleRemoveManager = (emailToRemove: string) => {
    const updatedManagers = (raffle.managers || []).filter(
      (m) => m.toLowerCase() !== emailToRemove.toLowerCase()
    );
    const updated = { ...raffle, managers: updatedManagers };
    rafflesRepository.update(raffle.id, updated);
    setRaffle(updated);
    toast.success(`Manager ${emailToRemove} removed.`);
  };

  const shareableManagerLink = `${window.location.origin}/join/${raffle.id}`;

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareableManagerLink);
    setCopiedLink(true);
    toast.success('Shareable event manager link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Back Link */}
      <div>
        <button
          onClick={() => navigate('/raffles')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Raffles</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                {raffle.raffleName}
              </h2>
              <Badge status={raffle.status}>{raffle.status}</Badge>
            </div>
            <p className="text-xs text-[#6B7280]">
              Event: <strong className="text-neutral-700">{raffle.eventName}</strong> • Ticket Price:{' '}
              <strong className="text-[#F97316]">{ticketFormatter.formatCurrency(raffle.ticketAmount)}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/raffles/${raffle.id}/design`}>
              <Button variant="outline" size="sm" leftIcon={<Palette className="w-4 h-4 text-[#F97316]" />}>
                Ticket Designer
              </Button>
            </Link>
            <Link to={`/raffles/${raffle.id}/generate`}>
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                Generate Tickets
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Workflow Tracker (Section 10) */}
      <Card className="p-4 bg-white">
        <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
          Production & Distribution Workflow
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {workflowSteps.map((step, idx) => (
            <div
              key={idx}
              onClick={() => {
                if (step.link) navigate(step.link);
                if (step.tab) setActiveTab(step.tab as any);
              }}
              className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex flex-col justify-between ${
                step.completed
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950 font-semibold'
                  : 'bg-neutral-50/60 border-neutral-200 text-neutral-600 hover:border-[#F97316]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-neutral-400 font-mono">0{idx + 1}</span>
                {step.completed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-neutral-300" />
                )}
              </div>
              <span className="truncate leading-snug">{step.title}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-[#E5E5E5] flex items-center gap-2 overflow-x-auto text-xs font-semibold select-none">
        {[
          { id: 'overview', label: 'Overview', icon: <Trophy className="w-4 h-4" /> },
          { id: 'booklets', label: `Booklets (${booklets.length})`, icon: <BookOpen className="w-4 h-4" /> },
          { id: 'tickets', label: `Tickets (${tickets.length})`, icon: <TicketIcon className="w-4 h-4" /> },
          { id: 'printSets', label: `Print Sets (${printSets.length})`, icon: <Printer className="w-4 h-4" /> },
          { id: 'sales', label: `Sales (${soldCount + usedCount})`, icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'settings', label: 'Settings', icon: <SettingsIcon className="w-4 h-4" /> },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-all whitespace-nowrap ${
              activeTab === t.id
                ? 'border-[#F97316] text-[#ea580c] font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="p-3.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Tickets
              </span>
              <div className="text-xl font-black text-neutral-900 mt-1">{tickets.length}</div>
            </Card>

            <Card className="p-3.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Available
              </span>
              <div className="text-xl font-black text-neutral-700 mt-1">{availableCount}</div>
            </Card>

            <Card className="p-3.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Assigned
              </span>
              <div className="text-xl font-black text-orange-600 mt-1">{assignedCount}</div>
            </Card>

            <Card className="p-3.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Sold
              </span>
              <div className="text-xl font-black text-emerald-600 mt-1">{soldCount}</div>
            </Card>

            <Card className="p-3.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Admitted (Used)
              </span>
              <div className="text-xl font-black text-blue-600 mt-1">{usedCount}</div>
            </Card>

            <Card className="p-3.5">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Total Sales
              </span>
              <div className="text-xl font-black text-neutral-900 mt-1">
                {ticketFormatter.formatCurrency(totalSales)}
              </div>
            </Card>
          </div>

          {/* Raffle Details & Quick Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5 space-y-3">
              <CardHeader className="pb-2 mb-2">
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-[#E5E5E5] pb-1.5">
                  <span className="text-neutral-500">Raffle Name:</span>
                  <span className="font-semibold text-neutral-900">{raffle.raffleName}</span>
                </div>
                <div className="flex justify-between border-b border-[#E5E5E5] pb-1.5">
                  <span className="text-neutral-500">Draw Date:</span>
                  <span className="font-semibold text-neutral-900">
                    {ticketFormatter.formatDate(raffle.drawDate)} at {raffle.drawTime || '7:00 PM'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#E5E5E5] pb-1.5">
                  <span className="text-neutral-500">Draw Venue:</span>
                  <span className="font-semibold text-neutral-900">{raffle.venue || '—'}</span>
                </div>
                <div className="flex justify-between border-b border-[#E5E5E5] pb-1.5">
                  <span className="text-neutral-500">Ticket Price:</span>
                  <span className="font-bold text-[#F97316]">
                    {ticketFormatter.formatCurrency(raffle.ticketAmount)}
                  </span>
                </div>
                {raffle.description && (
                  <div className="pt-1">
                    <span className="text-neutral-500 block mb-1">Description:</span>
                    <p className="text-neutral-700 bg-neutral-50 p-2.5 rounded-lg leading-relaxed">
                      {raffle.description}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-5 space-y-4">
              <CardHeader className="pb-2 mb-2">
                <CardTitle>Production Actions</CardTitle>
              </CardHeader>

              <div className="space-y-2.5">
                <div
                  onClick={() => navigate(`/raffles/${raffle.id}/design`)}
                  className="p-3.5 rounded-xl border border-[#E5E5E5] hover:border-[#F97316] hover:bg-orange-50/30 cursor-pointer flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center">
                      <Palette className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 group-hover:text-[#ea580c]">
                        Visual Ticket Designer
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Upload background, place ticket number & QR code
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#F97316]" />
                </div>

                <div
                  onClick={() => navigate(`/raffles/${raffle.id}/generate`)}
                  className="p-3.5 rounded-xl border border-[#E5E5E5] hover:border-[#F97316] hover:bg-orange-50/30 cursor-pointer flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 group-hover:text-[#ea580c]">
                        Generate Sequential Tickets
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        Create consecutive booklets and interleaved print set
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#F97316]" />
                </div>

                <div
                  onClick={() => setActiveTab('printSets')}
                  className="p-3.5 rounded-xl border border-[#E5E5E5] hover:border-[#F97316] hover:bg-orange-50/30 cursor-pointer flex items-center justify-between group transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 text-neutral-700 flex items-center justify-center">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-neutral-900 group-hover:text-[#ea580c]">
                        Print Sets & Physical Sheets
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {printSets.length} print set(s) ready for preview and printing
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#F97316]" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Booklets */}
      {activeTab === 'booklets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">
              Generated Booklets ({booklets.length})
            </h3>
            <Link to={`/raffles/${raffle.id}/generate`}>
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                Generate More Booklets
              </Button>
            </Link>
          </div>

          {booklets.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="w-7 h-7" />}
              title="No booklets yet"
              description="Generate a ticket set first to create grouped booklets."
              actionLabel="Generate Tickets"
              onAction={() => navigate(`/raffles/${raffle.id}/generate`)}
            />
          ) : (
            <BookletTable
              booklets={booklets}
              onAssign={(target) => setSelectedBooklet(target)}
              onMarkSold={(target) => setSoldBooklet(target)}
              onView={(target) => navigate(`/booklets/${target.id}`)}
              onSaved={loadRaffleData}
            />
          )}
        </div>
      )}

      {/* TAB CONTENT: Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {tickets.length === 0 ? (
            <EmptyState
              icon={<TicketIcon className="w-7 h-7" />}
              title="No tickets generated"
              description="Generate ticket numbers to populate this raffle event."
              actionLabel="Generate Tickets"
              onAction={() => navigate(`/raffles/${raffle.id}/generate`)}
            />
          ) : (
            <TicketTable
              tickets={tickets}
              booklets={booklets}
              onViewTicket={(t) => setSelectedTicket(t)}
              onBulkAssign={(ids) => {
                setBulkAssignTicketIds(ids);
                setIsBulkAssignOpen(true);
              }}
              onBulkStatusChange={handleBulkStatusChange}
            />
          )}
        </div>
      )}

      {/* TAB CONTENT: Print Sets */}
      {activeTab === 'printSets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">
              Print Sets ({printSets.length})
            </h3>
            <Link to={`/raffles/${raffle.id}/generate`}>
              <Button variant="primary" size="sm" leftIcon={<Sparkles className="w-4 h-4" />}>
                Generate Next Set
              </Button>
            </Link>
          </div>

          {printSets.length === 0 ? (
            <EmptyState
              icon={<Printer className="w-7 h-7" />}
              title="No print sets"
              description="Generate tickets to create your first print set."
              actionLabel="Generate Tickets"
              onAction={() => navigate(`/raffles/${raffle.id}/generate`)}
            />
          ) : (
            <PrintSetTable
              printSets={printSets}
              onPrint={handlePrintSet}
              onTogglePrinted={handleToggleSetPrinted}
              onDelete={(id) => setDeleteSetId(id)}
              showRaffleColumn={false}
            />
          )}
        </div>
      )}

      {/* TAB CONTENT: Sales */}
      {activeTab === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-gradient-to-br from-emerald-50/70 to-teal-50/30 border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Revenue Collected
              </span>
              <div className="text-xl font-black text-emerald-950 mt-1">
                {ticketFormatter.formatCurrency(totalSales)}
              </div>
              <span className="text-[11px] text-emerald-700 mt-0.5 block">
                {(soldCount + usedCount)} of {tickets.length} tickets sold
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Sell-Through Rate
              </span>
              <div className="text-xl font-black text-neutral-900 mt-1">
                {tickets.length > 0 ? Math.round(((soldCount + usedCount) / tickets.length) * 100) : 0}%
              </div>
              <span className="text-[11px] text-neutral-500 mt-0.5 block">
                {availableCount} tickets still available
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Assigned in Circulation
              </span>
              <div className="text-xl font-black text-orange-600 mt-1">
                {assignedCount}
              </div>
              <span className="text-[11px] text-neutral-500 mt-0.5 block">
                With solicitors in field
              </span>
            </Card>

            <Card className="p-4">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                Admitted at Door
              </span>
              <div className="text-xl font-black text-blue-600 mt-1">
                {usedCount}
              </div>
              <span className="text-[11px] text-neutral-500 mt-0.5 block">
                Validated via QR Scanner
              </span>
            </Card>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-900">
              Recent Sales for {raffle.raffleName}
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/sales?raffleId=${raffle.id}`)}
              leftIcon={<TrendingUp className="w-4 h-4" />}
            >
              Open Full Sales Tracker Page
            </Button>
          </div>

          {/* Sold Tickets Table */}
          {tickets.filter((t) => t.status === 'sold' || t.status === 'used').length === 0 ? (
            <EmptyState
              icon={<DollarSign className="w-8 h-8" />}
              title="No tickets sold yet"
              description="Mark tickets or booklets as sold to track revenue and solicitors."
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
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Sold Date</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {tickets
                      .filter((t) => t.status === 'sold' || t.status === 'used')
                      .slice(0, 20)
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-orange-50/30">
                          <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                            {t.ticketNumber}
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-600">
                            {(() => {
                              const b = booklets.find((bk) => bk.id === t.bookletId);
                              return b ? `B#${String(b.bookletNumber).padStart(3, '0')}` : '—';
                            })()}
                          </td>
                          <td className="py-3 px-4 font-semibold text-neutral-900">
                            {t.buyerName || '—'}
                          </td>
                          <td className="py-3 px-4 text-neutral-600">
                            {t.solicitorName || '—'}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#F97316]">
                            {ticketFormatter.formatCurrency(raffle.ticketAmount)}
                          </td>
                          <td className="py-3 px-4 text-neutral-500">
                            {t.soldAt ? new Date(t.soldAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <Badge status={t.status}>{t.status}</Badge>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: Settings */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* General Raffle Settings */}
          <Card className="p-6 space-y-4">
            <CardHeader className="pb-2 border-b border-[#E5E5E5]">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-[#F97316]" />
                <span>Raffle Parameters</span>
              </CardTitle>
            </CardHeader>
            <form onSubmit={handleUpdateRaffleSettings} className="space-y-4">
              <Input
                label="Raffle Name"
                value={raffle.raffleName}
                onChange={(e) => setRaffle({ ...raffle, raffleName: e.target.value })}
              />
              <Input
                label="Event Name"
                value={raffle.eventName}
                onChange={(e) => setRaffle({ ...raffle, eventName: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Ticket Amount (₱)"
                  type="number"
                  value={raffle.ticketAmount}
                  onChange={(e) => setRaffle({ ...raffle, ticketAmount: Number(e.target.value) })}
                />
                <Input
                  label="Draw Date"
                  type="date"
                  value={raffle.drawDate}
                  onChange={(e) => setRaffle({ ...raffle, drawDate: e.target.value })}
                />
              </div>
              <Input
                label="Venue"
                value={raffle.venue || ''}
                onChange={(e) => setRaffle({ ...raffle, venue: e.target.value })}
              />
              <Select
                label="Status"
                value={raffle.status}
                onChange={(e) => setRaffle({ ...raffle, status: e.target.value as any })}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
              </Select>

              <div className="pt-3 border-t border-[#E5E5E5] flex justify-end">
                <Button variant="primary" size="md" type="submit">
                  Save Raffle Changes
                </Button>
              </div>
            </form>
          </Card>

          {/* Event Managers & Shareable Link Card */}
          <Card className="p-6 space-y-5">
            <div>
              <CardHeader className="pb-2 border-b border-[#E5E5E5]">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#F97316]" />
                  <span>Event Managers & Access Link</span>
                </CardTitle>
              </CardHeader>
              <p className="text-xs text-neutral-500 mt-2">
                Add managers by email. They can access and manage this event using a shared link with email-only verification.
              </p>
            </div>

            {/* Add Manager Form */}
            <form onSubmit={handleAddManager} className="space-y-3">
              <label className="block text-xs font-bold text-neutral-700">
                Add Manager by Email
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={newManagerEmail}
                    onChange={(e) => setNewManagerEmail(e.target.value)}
                    placeholder="manager@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-neutral-900"
                  />
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                >
                  Add Manager
                </Button>
              </div>
            </form>

            {/* Active Managers List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-neutral-700">
                <span>Authorized Managers ({raffle.managers?.length || 0})</span>
              </div>

              {(!raffle.managers || raffle.managers.length === 0) ? (
                <div className="p-3.5 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-center text-xs text-neutral-500">
                  No event managers added yet. Add an email above to grant manager access.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {raffle.managers.map((mgrEmail) => (
                    <div
                      key={mgrEmail}
                      className="p-2.5 rounded-lg border border-neutral-200 bg-neutral-50/70 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-[11px] shrink-0">
                          {mgrEmail.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-semibold text-neutral-900 block truncate">
                            {mgrEmail}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Manager Access Granted
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveManager(mgrEmail)}
                        className="text-neutral-400 hover:text-red-600 p-1.5 h-auto"
                        title="Remove manager"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shareable Link Box */}
            <div className="p-4 rounded-xl bg-orange-50/60 border border-orange-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-[#F97316]" />
                  Shareable Event Link
                </span>
                <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                  Same link for all managers
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareableManagerLink}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-orange-200 rounded-lg text-neutral-800 focus:outline-none select-all"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyShareLink}
                  leftIcon={copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-neutral-500">
                  Managers log in using email only. No password required.
                </p>
                <a
                  href={`/join/${raffle.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-[#ea580c] hover:underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Test Link</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Manager Permissions Notice */}
            <div className="p-3 rounded-lg bg-neutral-100/70 border border-neutral-200/60 space-y-1.5">
              <div className="text-[11px] font-bold text-neutral-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Manager Access Limits:
              </div>
              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Managers are restricted exclusively to: <strong>Generate Tickets</strong>, <strong>Booklets</strong>, <strong>Ticket Inventory</strong>, <strong>Print Sets</strong>, and <strong>QR Scanner</strong>.
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Booklet Assign Modal (Requires Solicitor) */}
      <BookletAssignModal
        booklet={selectedBooklet}
        isOpen={!!selectedBooklet}
        onClose={() => setSelectedBooklet(null)}
        onSaved={loadRaffleData}
      />

      {/* Booklet Mark Sold Modal (Requires Buyer) */}
      <BookletMarkSoldModal
        booklet={soldBooklet}
        isOpen={!!soldBooklet}
        onClose={() => setSoldBooklet(null)}
        onSaved={loadRaffleData}
      />

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdated={loadRaffleData}
      />

      {/* Bulk Assign Modal (Requires Solicitor) */}
      <BulkAssignModal
        selectedTicketIds={bulkAssignTicketIds}
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        onAssigned={loadRaffleData}
      />

      {/* Bulk Mark Sold Modal (Requires Buyer) */}
      <TicketMarkSoldModal
        selectedTicketIds={bulkSoldTicketIds}
        isOpen={bulkSoldTicketIds.length > 0}
        onClose={() => setBulkSoldTicketIds([])}
        onSaved={loadRaffleData}
      />

      {/* Delete Set Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteSetId}
        onClose={() => setDeleteSetId(null)}
        onConfirm={handleConfirmDeleteSet}
        title="Delete Print Set?"
        message="This will delete this print set and all associated tickets and booklets generated within it."
        confirmLabel="Delete Set"
        variant="danger"
      />
    </div>
  );
};
