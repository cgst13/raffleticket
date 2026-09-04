import React, { useState, useEffect, useMemo } from 'react';
import { Booklet } from '../../types/booklet';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { NameSelectorInput } from '../ui/NameSelectorInput';
import { bookletsRepository } from '../../services/storage/bookletsRepository';
import { ticketsRepository } from '../../services/storage/ticketsRepository';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2 } from 'lucide-react';

interface BookletMarkSoldModalProps {
  booklet?: Booklet | null;
  selectedBookletIds?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const BookletMarkSoldModal: React.FC<BookletMarkSoldModalProps> = ({
  booklet,
  selectedBookletIds = [],
  isOpen,
  onClose,
  onSaved,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [solicitorName, setSolicitorName] = useState('');
  const toast = useToast();

  const isBulk = !booklet && selectedBookletIds.length > 0;
  const count = booklet ? 1 : selectedBookletIds.length;

  const targetBooklets = useMemo(() => {
    if (booklet) return [booklet];
    if (selectedBookletIds.length > 0) {
      return selectedBookletIds
        .map((id) => bookletsRepository.getById(id))
        .filter(Boolean) as Booklet[];
    }
    return [];
  }, [booklet, selectedBookletIds]);

  const targetRaffleId = targetBooklets[0]?.raffleId;

  useEffect(() => {
    if (booklet) {
      setBuyerName(booklet.buyerName || '');
      setSolicitorName(booklet.solicitorName || '');
    } else {
      setBuyerName('');
      setSolicitorName('');
    }
  }, [booklet, isOpen]);

  if (!isOpen || (!booklet && selectedBookletIds.length === 0)) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName.trim()) {
      toast.error('Buyer Name is required to mark booklet(s) as Sold.');
      return;
    }

    const trimmedBuyer = buyerName.trim();
    const trimmedSolicitor = solicitorName.trim();
    const now = new Date().toISOString();

    let totalTicketsUpdated = 0;

    targetBooklets.forEach((b) => {
      const resolvedSol = trimmedSolicitor || b.solicitorName;
      // 1. Update Booklet
      bookletsRepository.update(b.id, {
        buyerName: trimmedBuyer,
        solicitorName: resolvedSol || undefined,
        status: 'sold',
      });

      // 2. Update all active tickets in booklet
      const bTickets = ticketsRepository.getAll({ bookletId: b.id });
      const activeTicketIds = bTickets.filter((t) => t.status !== 'cancelled').map((t) => t.id);

      ticketsRepository.updateMany(activeTicketIds, {
        buyerName: trimmedBuyer,
        solicitorName: resolvedSol || undefined,
        status: 'sold',
        soldAt: now,
      });

      totalTicketsUpdated += activeTicketIds.length;
    });

    if (booklet) {
      toast.success(`Booklet #${booklet.bookletNumber} and all associated tickets marked as Sold to ${trimmedBuyer}!`);
    } else {
      toast.success(`Marked ${targetBooklets.length} booklets (${totalTicketsUpdated} tickets) as Sold to ${trimmedBuyer}!`);
    }

    onSaved();
    onClose();
  };

  const titleText = booklet
    ? `Mark Booklet #${String(booklet.bookletNumber).padStart(3, '0')} as Sold`
    : `Mark ${count} Selected Booklets as Sold`;

  const descriptionText = booklet
    ? `Ticket range: ${booklet.startTicketNumber} – ${booklet.endTicketNumber} (${booklet.totalTickets} tickets)`
    : `Apply buyer details and mark all ${count} selected booklets and their tickets as Sold.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{titleText}</span>
        </div>
      }
      description={descriptionText}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NameSelectorInput
          label="Buyer Name *"
          placeholder="e.g. Maria Santos"
          value={buyerName}
          onChange={setBuyerName}
          category="buyer"
          raffleId={targetRaffleId}
          helperText="Required. This buyer will be applied to the selected booklet(s) and all tickets."
          required
          autoFocus
        />

        <NameSelectorInput
          label="Solicitor Name (Optional)"
          placeholder="e.g. Juan Dela Cruz"
          value={solicitorName}
          onChange={setSolicitorName}
          category="solicitor"
          raffleId={targetRaffleId}
          helperText="Optional. Leave blank to preserve existing solicitor assignments."
        />

        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Confirm Sale Status</span>
          </div>
          <p className="text-[11px] text-emerald-700 leading-relaxed">
            Marking {count > 1 ? `${count} booklets` : 'this booklet'} as Sold will update all tickets inside {count > 1 ? 'them' : 'it'} to <strong>Sold</strong>.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            {isBulk ? `Mark ${count} Booklets Sold` : 'Mark Booklet as Sold'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
