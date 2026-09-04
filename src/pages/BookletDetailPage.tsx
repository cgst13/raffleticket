import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { printSetsRepository } from '../services/storage/printSetsRepository';
import { ticketFormatter } from '../services/tickets/ticketFormatter';
import { Booklet } from '../types/booklet';
import { Ticket } from '../types/ticket';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BookletAssignModal } from '../components/booklets/BookletAssignModal';
import { BookletMarkSoldModal } from '../components/booklets/BookletMarkSoldModal';
import { TicketTable } from '../components/tickets/TicketTable';
import { TicketDetailModal } from '../components/tickets/TicketDetailModal';
import { BulkAssignModal } from '../components/tickets/BulkAssignModal';
import { TicketMarkSoldModal } from '../components/tickets/TicketMarkSoldModal';
import { useToast } from '../context/ToastContext';
import {
  BookOpen,
  ArrowLeft,
  UserCheck,
  User,
  CheckCircle2,
  Printer,
  Calendar,
} from 'lucide-react';

export const BookletDetailPage: React.FC = () => {
  const { bookletId } = useParams<{ bookletId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [booklet, setBooklet] = useState<Booklet | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isMarkSoldOpen, setIsMarkSoldOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [bulkAssignIds, setBulkAssignIds] = useState<string[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [bulkSoldTicketIds, setBulkSoldTicketIds] = useState<string[]>([]);

  const loadData = () => {
    if (!bookletId) return;
    const b = bookletsRepository.getById(bookletId);
    if (!b) {
      navigate('/booklets');
      return;
    }
    setBooklet(b);
    setTickets(ticketsRepository.getAll({ bookletId }));
  };

  useEffect(() => {
    loadData();
  }, [bookletId]);

  if (!booklet) return null;

  const raffle = rafflesRepository.getById(booklet.raffleId);
  const printSet = printSetsRepository.getById(booklet.printSetId);

  const handleMarkSold = () => {
    bookletsRepository.update(booklet.id, { status: 'sold' });
    ticketsRepository.updateMany(tickets.map((t) => t.id), {
      status: 'sold',
      soldAt: new Date().toISOString(),
    });
    toast.success(`Booklet #${booklet.bookletNumber} and all its tickets marked as Sold!`);
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
                Booklet #{String(booklet.bookletNumber).padStart(3, '0')}
              </h2>
              <Badge status={booklet.status}>{booklet.status}</Badge>
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
              onClick={() => setIsAssignOpen(true)}
              leftIcon={<UserCheck className="w-4 h-4" />}
            >
              Assign Booklet
            </Button>
            {booklet.status !== 'sold' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsMarkSoldOpen(true)}
                leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              >
                Mark Booklet as Sold
              </Button>
            )}
            {printSet && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(`/print-sets/${printSet.id}/preview`)}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                Print Set
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metadata Card */}
      <Card className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-neutral-500 block mb-0.5">Consecutive Range:</span>
            <span className="font-mono font-bold text-sm text-[#c2410c]">
              {booklet.startTicketNumber} – {booklet.endTicketNumber}
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block mb-0.5">Booklet Solicitor:</span>
            <span className="font-semibold text-neutral-900">
              {booklet.solicitorName || <span className="text-neutral-400 italic">Unassigned</span>}
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block mb-0.5">Booklet Buyer:</span>
            <span className="font-semibold text-neutral-900">
              {booklet.buyerName || <span className="text-neutral-400 italic">Unassigned</span>}
            </span>
          </div>

          <div>
            <span className="text-neutral-500 block mb-0.5">Total Tickets:</span>
            <span className="font-bold text-neutral-900 font-mono">
              {booklet.totalTickets} tickets
            </span>
          </div>
        </div>
      </Card>

      {/* Tickets List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">
            Tickets in this Booklet ({tickets.length})
          </h3>
          <p className="text-xs text-neutral-500">
            Tickets inherit booklet solicitor/buyer unless individually overridden.
          </p>
        </div>

        <TicketTable
          tickets={tickets}
          booklets={[booklet]}
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
      </div>

      {/* Modals */}
      <BookletAssignModal
        booklet={booklet}
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSaved={loadData}
      />
      <BookletMarkSoldModal
        booklet={booklet}
        isOpen={isMarkSoldOpen}
        onClose={() => setIsMarkSoldOpen(false)}
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
    </div>
  );
};
