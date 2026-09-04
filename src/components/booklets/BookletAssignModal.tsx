import React, { useState, useEffect, useMemo } from 'react';
import { Booklet } from '../../types/booklet';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { NameSelectorInput } from '../ui/NameSelectorInput';
import { bookletsRepository } from '../../services/storage/bookletsRepository';
import { ticketsRepository } from '../../services/storage/ticketsRepository';
import { useToast } from '../../context/ToastContext';
import { UserCheck } from 'lucide-react';

interface BookletAssignModalProps {
  booklet?: Booklet | null;
  selectedBookletIds?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const BookletAssignModal: React.FC<BookletAssignModalProps> = ({
  booklet,
  selectedBookletIds = [],
  isOpen,
  onClose,
  onSaved,
}) => {
  const [solicitor, setSolicitor] = useState('');
  const [buyer, setBuyer] = useState('');
  const [syncTickets, setSyncTickets] = useState(true);
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
      setSolicitor(booklet.solicitorName || '');
      setBuyer(booklet.buyerName || '');
      setSyncTickets(true);
    } else {
      setSolicitor('');
      setBuyer('');
      setSyncTickets(true);
    }
  }, [booklet, isOpen]);

  if (!isOpen || (!booklet && selectedBookletIds.length === 0)) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!solicitor.trim()) {
      toast.error('Solicitor Name is required to assign booklet(s).');
      return;
    }

    const trimmedSolicitor = solicitor.trim();
    const trimmedBuyer = buyer.trim();
    const updatedStatus = 'assigned';

    let totalTicketsUpdated = 0;

    targetBooklets.forEach((b) => {
      bookletsRepository.update(b.id, {
        solicitorName: trimmedSolicitor,
        buyerName: trimmedBuyer || undefined,
        status: b.status === 'sold' ? 'sold' : updatedStatus,
      });

      if (syncTickets) {
        const bookletTickets = ticketsRepository.getAll({ bookletId: b.id });
        const ids = bookletTickets.map((t) => t.id);
        ticketsRepository.updateMany(ids, {
          solicitorName: trimmedSolicitor,
          buyerName: trimmedBuyer || undefined,
          status: b.status === 'sold' ? undefined : 'assigned',
        });
        totalTicketsUpdated += ids.length;
      }
    });

    if (booklet) {
      toast.success(`Booklet #${booklet.bookletNumber} assigned to ${trimmedSolicitor}!`);
    } else {
      toast.success(`Assigned ${targetBooklets.length} booklets (${totalTicketsUpdated} tickets) to ${trimmedSolicitor}!`);
    }

    onSaved();
    onClose();
  };

  const titleText = booklet
    ? `Assign Booklet #${String(booklet.bookletNumber).padStart(3, '0')}`
    : `Assign ${count} Selected Booklets`;

  const descriptionText = booklet
    ? `Ticket range: ${booklet.startTicketNumber} – ${booklet.endTicketNumber} (${booklet.totalTickets} tickets)`
    : `Apply solicitor and buyer details across all ${count} selected booklets and their tickets.`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#F97316]" />
          <span>{titleText}</span>
        </div>
      }
      description={descriptionText}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NameSelectorInput
          label="Solicitor Name *"
          placeholder="e.g. Juan Dela Cruz"
          value={solicitor}
          onChange={setSolicitor}
          category="solicitor"
          raffleId={targetRaffleId}
          helperText="Required. The solicitor/agent assigned to distribute these booklets."
          required
          autoFocus
        />

        <NameSelectorInput
          label="Buyer / Donor Name (Optional)"
          placeholder="e.g. Maria Santos"
          value={buyer}
          onChange={setBuyer}
          category="buyer"
          raffleId={targetRaffleId}
          helperText="Optional default buyer for the booklet(s)."
        />

        <div className="pt-2 border-t border-[#E5E5E5]">
          <label className="flex items-start gap-2 text-xs text-neutral-600 cursor-pointer">
            <input
              type="checkbox"
              checked={syncTickets}
              onChange={(e) => setSyncTickets(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 text-[#F97316] focus:ring-[#F97316]"
            />
            <span>
              <strong>Apply to all tickets inside {count > 1 ? 'these booklets' : 'this booklet'}</strong> (updates solicitor and status for all associated tickets).
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" className="bg-[#F97316] hover:bg-[#ea580c]">
            {isBulk ? `Assign ${count} Booklets` : 'Save Assignment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
