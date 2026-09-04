import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { printSetsRepository } from '../services/storage/printSetsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { ticketFormatter } from '../services/tickets/ticketFormatter';
import { PrintSet } from '../types/printSet';
import { Booklet } from '../types/booklet';
import { Ticket } from '../types/ticket';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BookletCard } from '../components/booklets/BookletCard';
import { BookletTable } from '../components/booklets/BookletTable';
import { BookletAssignModal } from '../components/booklets/BookletAssignModal';
import { BookletMarkSoldModal } from '../components/booklets/BookletMarkSoldModal';
import { TicketTable } from '../components/tickets/TicketTable';
import { TicketDetailModal } from '../components/tickets/TicketDetailModal';
import { BulkAssignModal } from '../components/tickets/BulkAssignModal';
import { TicketMarkSoldModal } from '../components/tickets/TicketMarkSoldModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import {
  Printer,
  Eye,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  Ticket as TicketIcon,
  Trash2,
} from 'lucide-react';

export const PrintSetDetailPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [printSet, setPrintSet] = useState<PrintSet | null>(null);
  const [booklets, setBooklets] = useState<Booklet[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<'booklets' | 'tickets'>('booklets');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Modals
  const [selectedBooklet, setSelectedBooklet] = useState<Booklet | null>(null);
  const [soldBooklet, setSoldBooklet] = useState<Booklet | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [bulkAssignIds, setBulkAssignIds] = useState<string[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkSoldTicketIds, setBulkSoldTicketIds] = useState<string[]>([]);

  const loadData = () => {
    if (!setId) return;
    const set = printSetsRepository.getById(setId);
    if (!set) {
      navigate('/print-sets');
      return;
    }
    setPrintSet(set);
    setBooklets(bookletsRepository.getAll({ printSetId: setId }));
    setTickets(ticketsRepository.getAll({ printSetId: setId }));
  };

  useEffect(() => {
    loadData();
  }, [setId]);

  if (!printSet) return null;

  const raffle = rafflesRepository.getById(printSet.raffleId);

  const handlePrint = () => {
    printSetsRepository.update(printSet.id, { status: 'printed' });
    toast.success(`Print Set #${String(printSet.setNumber).padStart(3, '0')} marked as Printed! Opening preview...`);
    loadData();
    navigate(`/print-sets/${printSet.id}/preview`);
  };

  const handleTogglePrinted = () => {
    const newStatus = printSet.status === 'printed' ? 'generated' : 'printed';
    printSetsRepository.update(printSet.id, { status: newStatus });
    toast.success(`Print Set status updated to ${newStatus}.`);
    loadData();
  };

  const handleReprint = () => {
    printSetsRepository.update(printSet.id, { status: 'reprinted' });
    toast.info('Status updated to Reprinted.');
    loadData();
    navigate(`/print-sets/${printSet.id}/preview`);
  };

  const handleConfirmDelete = () => {
    if (!printSet) return;
    printSetsRepository.delete(printSet.id);
    ticketsRepository.deleteByPrintSetId(printSet.id);
    bookletsRepository.deleteByPrintSetId(printSet.id);
    toast.success('Print Set and associated tickets deleted.');
    navigate('/print-sets');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/print-sets')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Print Sets</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                Print Set #{String(printSet.setNumber).padStart(3, '0')}
              </h2>
              <Badge status={printSet.status}>{printSet.status}</Badge>
            </div>
            <p className="text-xs text-[#6B7280]">
              Raffle:{' '}
              <Link to={`/raffles/${raffle?.id}`} className="font-semibold text-neutral-800 hover:underline">
                {raffle?.raffleName || 'Raffle Event'}
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTogglePrinted}
              className="text-xs"
            >
              {printSet.status === 'printed' ? 'Mark Unprinted' : 'Mark Printed'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReprint}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reprint
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="font-bold"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Now
            </Button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
              title="Delete Print Set"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Set Details Stats Card */}
      <Card className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <span className="text-neutral-500 block mb-0.5">Ticket Range</span>
            <span className="font-mono font-bold text-sm text-[#c2410c]">
              {printSet.startingTicketNumber} – {printSet.endingTicketNumber}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-0.5">Total Tickets</span>
            <span className="font-bold text-sm text-neutral-900 font-mono">
              {printSet.totalTickets} pcs
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-0.5">Total Booklets</span>
            <span className="font-bold text-sm text-neutral-900 font-mono">
              {printSet.totalBooklets} booklets
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-0.5">Tickets / Booklet</span>
            <span className="font-bold text-sm text-neutral-900 font-mono">
              {printSet.ticketsPerBooklet}
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-0.5">Interleaved Pages</span>
            <span className="font-bold text-sm text-neutral-900 font-mono">
              {printSet.totalPages} pages
            </span>
          </div>
          <div>
            <span className="text-neutral-500 block mb-0.5">Created Date</span>
            <span className="font-medium text-neutral-800">
              {ticketFormatter.formatDate(printSet.createdAt)}
            </span>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-[#E5E5E5] flex items-center gap-2 text-xs font-semibold select-none">
        <button
          onClick={() => setActiveTab('booklets')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-all ${
            activeTab === 'booklets'
              ? 'border-[#F97316] text-[#ea580c] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Booklets in Set ({booklets.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`flex items-center gap-2 py-3 px-3.5 border-b-2 transition-all ${
            activeTab === 'tickets'
              ? 'border-[#F97316] text-[#ea580c] font-bold'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <TicketIcon className="w-4 h-4" />
          <span>Tickets in Set ({tickets.length})</span>
        </button>
      </div>

      {activeTab === 'booklets' ? (
        <BookletTable
          booklets={booklets}
          onAssign={(target) => setSelectedBooklet(target)}
          onMarkSold={(target) => setSoldBooklet(target)}
          onView={(target) => navigate(`/booklets/${target.id}`)}
          onSaved={loadData}
        />
      ) : (
        <TicketTable
          tickets={tickets}
          booklets={booklets}
          onViewTicket={(t) => setSelectedTicket(t)}
          onBulkAssign={(ids) => {
            setBulkAssignIds(ids);
            setIsBulkAssignOpen(true);
          }}
          onBulkStatusChange={(ids, status) => {
            if (status === 'sold') {
              setBulkSoldTicketIds(ids);
              return;
            }
            ticketsRepository.updateMany(ids, { status });
            toast.success(`Updated ${ids.length} ticket(s) to ${status}!`);
            loadData();
          }}
        />
      )}

      {/* Modals */}
      <BookletAssignModal
        booklet={selectedBooklet}
        isOpen={!!selectedBooklet}
        onClose={() => setSelectedBooklet(null)}
        onSaved={loadData}
      />
      <BookletMarkSoldModal
        booklet={soldBooklet}
        isOpen={!!soldBooklet}
        onClose={() => setSoldBooklet(null)}
        onSaved={loadData}
      />
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        onUpdated={loadData}
      />
      <BulkAssignModal
        selectedTicketIds={bulkAssignIds}
        isOpen={isBulkAssignOpen}
        onClose={() => setIsBulkAssignOpen(false)}
        onAssigned={loadData}
      />
      <TicketMarkSoldModal
        selectedTicketIds={bulkSoldTicketIds}
        isOpen={bulkSoldTicketIds.length > 0}
        onClose={() => setBulkSoldTicketIds([])}
        onSaved={loadData}
      />
      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Print Set?"
        message="This will delete this print set and all tickets and booklets generated within it. This action cannot be undone."
        confirmLabel="Delete Set"
        variant="danger"
      />
    </div>
  );
};
