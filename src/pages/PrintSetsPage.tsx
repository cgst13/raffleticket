import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { printSetsRepository } from '../services/storage/printSetsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { PrintSet } from '../types/printSet';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import {
  Printer,
  Eye,
  Trash2,
  Calendar,
  BookOpen,
  Plus,
} from 'lucide-react';
import { ticketFormatter } from '../services/tickets/ticketFormatter';

import { PrintSetTable } from '../components/sets/PrintSetTable';

export const PrintSetsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [printSets, setPrintSets] = useState<PrintSet[]>(printSetsRepository.getAll());
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);

  const raffles = rafflesRepository.getAll();
  const raffleMap = new Map(raffles.map((r) => [r.id, r]));

  const refreshSets = () => {
    setPrintSets(printSetsRepository.getAll());
  };

  const handlePrint = (set: PrintSet) => {
    printSetsRepository.update(set.id, { status: 'printed' });
    toast.success(`Print Set #${String(set.setNumber).padStart(3, '0')} marked as Printed! Opening preview...`);
    refreshSets();
    navigate(`/print-sets/${set.id}/preview`);
  };

  const handleTogglePrinted = (set: PrintSet) => {
    const newStatus = set.status === 'printed' ? 'generated' : 'printed';
    printSetsRepository.update(set.id, { status: newStatus });
    toast.success(`Print Set #${String(set.setNumber).padStart(3, '0')} status updated to ${newStatus}.`);
    refreshSets();
  };

  const handleConfirmDelete = () => {
    if (!deleteSetId) return;
    printSetsRepository.delete(deleteSetId);
    ticketsRepository.deleteByPrintSetId(deleteSetId);
    bookletsRepository.deleteByPrintSetId(deleteSetId);
    toast.success('Print Set and associated tickets deleted.');
    setDeleteSetId(null);
    refreshSets();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">Print Sets</h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            All generated interleaved print batches ready for production printing and cutting.
          </p>
        </div>
      </div>

      {printSets.length === 0 ? (
        <EmptyState
          icon={<Printer className="w-8 h-8" />}
          title="No print sets"
          description="Generate tickets for any raffle event to create an interleaved print set."
          actionLabel="Go to Raffles"
          onAction={() => navigate('/raffles')}
        />
      ) : (
        <PrintSetTable
          printSets={printSets}
          raffleMap={raffleMap}
          onPrint={handlePrint}
          onTogglePrinted={handleTogglePrinted}
          onDelete={(id) => setDeleteSetId(id)}
          showRaffleColumn={true}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteSetId}
        onClose={() => setDeleteSetId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Print Set?"
        message="This will delete the print set and all tickets and booklets generated within it."
        confirmLabel="Delete Set"
        variant="danger"
      />
    </div>
  );
};
