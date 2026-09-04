import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { printSetsRepository } from '../services/storage/printSetsRepository';
import { ticketFormatter } from '../services/tickets/ticketFormatter';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  Ticket,
  Printer,
  Trash2,
  Edit,
  ArrowRight,
} from 'lucide-react';

import { storageAdapter } from '../services/storage/storageAdapter';

export const RafflesListPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [raffles, setRaffles] = useState(rafflesRepository.getAll());
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const refreshRaffles = () => {
    setRaffles(rafflesRepository.getAll());
  };

  React.useEffect(() => {
    refreshRaffles();
    const unsubscribe = storageAdapter.subscribe(() => {
      refreshRaffles();
    });
    return unsubscribe;
  }, []);

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;
    rafflesRepository.delete(deleteTargetId);
    ticketsRepository.deleteByRaffleId(deleteTargetId);
    printSetsRepository.deleteByRaffleId(deleteTargetId);
    toast.success('Raffle and associated tickets deleted.');
    setDeleteTargetId(null);
    refreshRaffles();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">Raffle Events</h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Manage all raffle campaigns, configure ticket templates, and initiate ticket production.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/raffles/create">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              Create Raffle
            </Button>
          </Link>
        </div>
      </div>

      {/* Raffles Grid / Empty State */}
      {raffles.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-8 h-8" />}
          title="No raffles yet"
          description="Create your first raffle event to begin designing ticket layouts and generating sequential booklets."
          actionLabel="Create Raffle"
          onAction={() => navigate('/raffles/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {raffles.map((raffle) => {
            const ticketCount = ticketsRepository.getAll({ raffleId: raffle.id }).length;
            const printSetCount = printSetsRepository.getAll({ raffleId: raffle.id }).length;

            return (
              <Card
                key={raffle.id}
                hover
                className="flex flex-col justify-between p-5 border-[#E5E5E5] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Badge status={raffle.status}>{raffle.status}</Badge>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/raffles/${raffle.id}/design`)}
                        className="p-1.5 text-neutral-400 hover:text-[#ea580c] hover:bg-orange-50 rounded transition-colors"
                        title="Edit Ticket Design"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(raffle.id)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete Raffle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3
                    onClick={() => navigate(`/raffles/${raffle.id}`)}
                    className="text-base font-bold text-neutral-900 hover:text-[#ea580c] cursor-pointer transition-colors leading-snug line-clamp-1"
                  >
                    {raffle.raffleName}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium mt-0.5">{raffle.eventName}</p>

                  <div className="space-y-2 my-4 pt-3 border-t border-[#E5E5E5] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Ticket Price:</span>
                      <span className="font-bold text-neutral-900">
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
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] text-neutral-500 py-2.5 px-3 bg-neutral-50 rounded-lg mb-3">
                    <div className="flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5 text-[#F97316]" />
                      <span>{ticketCount} tickets</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Printer className="w-3.5 h-3.5 text-neutral-600" />
                      <span>{printSetCount} print set(s)</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-between group"
                    onClick={() => navigate(`/raffles/${raffle.id}`)}
                  >
                    <span>Manage Raffle</span>
                    <ArrowRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#F97316] group-hover:translate-x-0.5 transition-all" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

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
