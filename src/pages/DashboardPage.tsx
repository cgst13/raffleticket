import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { printSetsRepository } from '../services/storage/printSetsRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { settingsRepository } from '../services/storage/settingsRepository';
import { ticketFormatter } from '../services/tickets/ticketFormatter';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import {
  Trophy,
  Ticket,
  Printer,
  QrCode,
  Plus,
  ArrowRight,
  Clock,
  Coins,
  CheckCircle2,
  Calendar,
  MapPin,
  Search,
  BookOpen,
  Trash2,
  Palette,
  ExternalLink,
  Layers,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [raffles, setRaffles] = useState(rafflesRepository.getAll());
  const [tickets, setTickets] = useState(ticketsRepository.getAll());
  const [printSets, setPrintSets] = useState(printSetsRepository.getAll());
  const [booklets, setBooklets] = useState(bookletsRepository.getAll());
  const [activities, setActivities] = useState(settingsRepository.getActivities());

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed' | 'draft'>('all');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const refreshData = () => {
    setRaffles(rafflesRepository.getAll());
    setTickets(ticketsRepository.getAll());
    setPrintSets(printSetsRepository.getAll());
    setBooklets(bookletsRepository.getAll());
    setActivities(settingsRepository.getActivities());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    rafflesRepository.delete(deleteTargetId);
    ticketsRepository.deleteByRaffleId(deleteTargetId);
    printSetsRepository.deleteByRaffleId(deleteTargetId);
    bookletsRepository.deleteByRaffleId(deleteTargetId);
    toast.success('Raffle and associated data deleted.');
    setDeleteTargetId(null);
    refreshData();
  };

  // Metrics computation
  const totalRaffles = raffles.length;
  const activeRaffles = raffles.filter((r) => r.status === 'active').length;
  const totalTickets = tickets.length;
  const availableTickets = tickets.filter((t) => t.status === 'available').length;
  const assignedTickets = tickets.filter((t) => t.status === 'assigned').length;
  const soldTickets = tickets.filter((t) => t.status === 'sold').length;
  const usedTickets = tickets.filter((t) => t.status === 'used').length;

  const totalTicketValue = tickets.reduce((acc, t) => acc + (t.amount || 0), 0);
  const totalSoldValue = tickets
    .filter((t) => t.status === 'sold' || t.status === 'used')
    .reduce((acc, t) => acc + (t.amount || 0), 0);

  // Filtered Raffles
  const filteredRaffles = raffles.filter((raffle) => {
    const matchesStatus = statusFilter === 'all' || raffle.status === statusFilter;
    if (!matchesStatus) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      raffle.raffleName.toLowerCase().includes(q) ||
      raffle.eventName.toLowerCase().includes(q) ||
      (raffle.venue && raffle.venue.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-7">
      {/* ── Top Header & Actions ───────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight">
              Raffle Events
            </h1>
            <span className="px-2 py-0.5 text-xs font-extrabold bg-orange-100 text-[#ea580c] rounded-full">
              {totalRaffles} {totalRaffles === 1 ? 'Event' : 'Events'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
            Select a raffle event below to open its dedicated workspace, ticket designer, and distribution manager.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/raffles/create">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create New Raffle
            </Button>
          </Link>
        </div>
      </div>

      {/* ── System Summary Metrics ─────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Raffles */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Raffle Events</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111]">{totalRaffles}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
              {activeRaffles} Active {activeRaffles === 1 ? 'Event' : 'Events'}
            </div>
          </div>
        </Card>

        {/* Total Tickets Generated */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Tickets</span>
            <Ticket className="w-4 h-4 text-[#F97316]" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111]">{totalTickets.toLocaleString()}</div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
              {availableTickets} Available • {assignedTickets} Assigned
            </div>
          </div>
        </Card>

        {/* Sold & Admitted */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Sold & Admitted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600">{soldTickets + usedTickets}</div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
              {soldTickets} Sold • {usedTickets} Admitted at Draw
            </div>
          </div>
        </Card>

        {/* Sales Revenue */}
        <Card className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-neutral-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales</span>
            <Coins className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#111111]">
              {ticketFormatter.formatCurrency(totalSoldValue)}
            </div>
            <div className="text-[11px] text-neutral-500 font-medium mt-0.5">
              Potential: {ticketFormatter.formatCurrency(totalTicketValue)}
            </div>
          </div>
        </Card>
      </div>

      {/* ── Search & Filter Controls ───────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#E5E5E5]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by raffle name, event title, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:bg-white"
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto select-none">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'active', label: 'Active' },
            { id: 'completed', label: 'Completed' },
            { id: 'draft', label: 'Draft' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Raffle Events List (First & Prominent) ──── */}
      {filteredRaffles.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8" />}
          title={searchQuery ? 'No matching raffle events found' : 'No raffle events created yet'}
          description={
            searchQuery
              ? 'Try adjusting your search query or clear the filter.'
              : 'Create your first raffle event to begin designing tickets, generating consecutive booklets, and printing sheets.'
          }
          actionLabel="Create New Raffle"
          onAction={() => navigate('/raffles/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRaffles.map((raffle) => {
            const raffleTickets = tickets.filter((t) => t.raffleId === raffle.id);
            const raffleBooklets = booklets.filter((b) => b.raffleId === raffle.id);
            const raffleSets = printSets.filter((s) => s.raffleId === raffle.id);

            const soldOrUsedCount = raffleTickets.filter(
              (t) => t.status === 'sold' || t.status === 'used'
            ).length;
            const progressPercent =
              raffleTickets.length > 0
                ? Math.round((soldOrUsedCount / raffleTickets.length) * 100)
                : 0;

            return (
              <Card
                key={raffle.id}
                hover
                className="flex flex-col justify-between p-5 border-[#E5E5E5] transition-all group bg-white hover:border-[#F97316] hover:shadow-md"
              >
                <div>
                  {/* Card Header: Badge + Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge status={raffle.status}>{raffle.status}</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/raffles/${raffle.id}/design`)}
                        className="p-1.5 text-neutral-400 hover:text-[#ea580c] hover:bg-orange-50 rounded-md transition-colors"
                        title="Open Ticket Designer"
                      >
                        <Palette className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(raffle.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete Raffle Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Event Name */}
                  <h3
                    onClick={() => navigate(`/raffles/${raffle.id}`)}
                    className="text-base font-extrabold text-neutral-900 group-hover:text-[#ea580c] cursor-pointer transition-colors leading-snug line-clamp-1"
                  >
                    {raffle.raffleName}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5 truncate">
                    {raffle.eventName}
                  </p>

                  {/* Info details */}
                  <div className="space-y-2 my-4 pt-3.5 border-t border-[#E5E5E5] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Ticket Price:</span>
                      <span className="font-extrabold text-[#111111]">
                        {ticketFormatter.formatCurrency(raffle.ticketAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Draw Date:</span>
                      </span>
                      <span className="font-semibold text-neutral-800">
                        {ticketFormatter.formatDate(raffle.drawDate)}
                      </span>
                    </div>

                    {raffle.venue && (
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Venue:</span>
                        </span>
                        <span className="font-medium text-neutral-700 truncate max-w-[150px]">
                          {raffle.venue}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar (Sold vs Total) */}
                  {raffleTickets.length > 0 && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[11px] mb-1 font-semibold">
                        <span className="text-neutral-500">Sales Progress</span>
                        <span className="text-emerald-700 font-mono">
                          {soldOrUsedCount} / {raffleTickets.length} ({progressPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-500 rounded-full"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer: Stats summary + Open Event button */}
                <div className="pt-2">
                  <div className="grid grid-cols-3 gap-1 text-center text-[10px] text-neutral-500 py-2 px-2 bg-neutral-50 rounded-lg mb-3 border border-neutral-100 font-mono">
                    <div>
                      <div className="font-bold text-neutral-900 text-xs">{raffleTickets.length}</div>
                      <div>Tickets</div>
                    </div>
                    <div className="border-x border-neutral-200">
                      <div className="font-bold text-neutral-900 text-xs">{raffleBooklets.length}</div>
                      <div>Booklets</div>
                    </div>
                    <div>
                      <div className="font-bold text-neutral-900 text-xs">{raffleSets.length}</div>
                      <div>Print Sets</div>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full justify-between font-bold"
                    onClick={() => navigate(`/raffles/${raffle.id}`)}
                  >
                    <span>Open Raffle Event</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Bottom Section: Recent Activity Log ─────── */}
      <Card className="p-5 bg-white">
        <CardHeader className="flex items-center justify-between pb-3 mb-3 border-b border-[#E5E5E5]">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-neutral-500" />
            <span>Audit & Activity Log</span>
          </CardTitle>
          <span className="text-[11px] text-neutral-400 font-mono">
            {activities.length} total events recorded
          </span>
        </CardHeader>

        {activities.length === 0 ? (
          <div className="text-center py-6 text-xs text-neutral-400">
            No recent actions recorded.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activities.slice(0, 6).map((act) => (
              <div
                key={act.id}
                className="p-3 bg-neutral-50/70 border border-neutral-100 rounded-lg text-xs space-y-1"
              >
                <div className="font-bold text-neutral-900 leading-snug">{act.title}</div>
                <div className="text-neutral-500 text-[11px] leading-relaxed line-clamp-2">
                  {act.description}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono pt-1">
                  {ticketFormatter.formatDateTime(act.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Raffle Event?"
        message="Are you sure you want to delete this raffle? All associated tickets, booklets, and print sets will be permanently removed from local storage."
        confirmLabel="Delete Everything"
        variant="danger"
      />
    </div>
  );
};
