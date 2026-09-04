import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { Ticket, TicketStatus } from '../types/ticket';
import { TicketTable } from '../components/tickets/TicketTable';
import { TicketDetailModal } from '../components/tickets/TicketDetailModal';
import { BulkAssignModal } from '../components/tickets/BulkAssignModal';
import { TicketMarkSoldModal } from '../components/tickets/TicketMarkSoldModal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { Ticket as TicketIcon } from 'lucide-react';

export const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [tickets, setTickets] = useState<Ticket[]>(ticketsRepository.getAll());
  const [booklets, setBooklets] = useState(bookletsRepository.getAll());
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [bulkAssignIds, setBulkAssignIds] = useState<string[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkSoldTicketIds, setBulkSoldTicketIds] = useState<string[]>([]);

  const raffles = rafflesRepository.getAll();
  const [selectedRaffleId, setSelectedRaffleId] = useState<string>('all');

  const refreshTickets = () => {
    setTickets(ticketsRepository.getAll());
    setBooklets(bookletsRepository.getAll());
  };

  const filteredTickets = selectedRaffleId === 'all'
    ? tickets
    : tickets.filter((t) => t.raffleId === selectedRaffleId);

  const handleBulkStatusChange = (ids: string[], status: TicketStatus) => {
    if (status === 'sold') {
      setBulkSoldTicketIds(ids);
      return;
    }
    const updates: Partial<Ticket> = { status };
    if (status === 'used') updates.usedAt = new Date().toISOString();
    ticketsRepository.updateMany(ids, updates);
    toast.success(`Updated ${ids.length} ticket(s) to ${status}!`);
    refreshTickets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">Ticket Inventory</h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Search, filter, assign solicitors, and manage statuses across all generated tickets.
          </p>
        </div>

        {raffles.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-500 font-semibold">Raffle:</span>
            <select
              value={selectedRaffleId}
              onChange={(e) => setSelectedRaffleId(e.target.value)}
              className="px-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              <option value="all">All Raffles ({tickets.length} tickets)</option>
              {raffles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.raffleName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {tickets.length === 0 ? (
        <EmptyState
          icon={<TicketIcon className="w-8 h-8" />}
          title="No tickets generated"
          description="Generate tickets from any raffle event to populate the inventory."
          actionLabel="Go to Raffles"
          onAction={() => navigate('/raffles')}
        />
      ) : (
        <TicketTable
          tickets={filteredTickets}
          booklets={booklets}
          onViewTicket={(t) => setSelectedTicket(t)}
          onBulkAssign={(ids) => {
            setBulkAssignIds(ids);
            setIsBulkAssignOpen(true);
          }}
          onBulkStatusChange={handleBulkStatusChange}
        />
      )}

      {/* Ticket Detail Modal */}
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdated={refreshTickets}
      />

      {/* Bulk Assign Modal (Requires Solicitor) */}
      <BulkAssignModal
        selectedTicketIds={bulkAssignIds}
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        onAssigned={refreshTickets}
      />

      {/* Bulk Mark Sold Modal (Requires Buyer) */}
      <TicketMarkSoldModal
        selectedTicketIds={bulkSoldTicketIds}
        isOpen={bulkSoldTicketIds.length > 0}
        onClose={() => setBulkSoldTicketIds([])}
        onSaved={refreshTickets}
      />
    </div>
  );
};
