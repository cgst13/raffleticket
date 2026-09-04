import React, { useState, useEffect } from 'react';
import { Ticket } from '../../types/ticket';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { NameSelectorInput } from '../ui/NameSelectorInput';
import { ticketsRepository } from '../../services/storage/ticketsRepository';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2 } from 'lucide-react';

interface TicketMarkSoldModalProps {
  ticket?: Ticket | null;
  selectedTicketIds?: string[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const TicketMarkSoldModal: React.FC<TicketMarkSoldModalProps> = ({
  ticket,
  selectedTicketIds = [],
  isOpen,
  onClose,
  onSaved,
}) => {
  const [buyerName, setBuyerName] = useState('');
  const [solicitorName, setSolicitorName] = useState('');
  const toast = useToast();

  const isBulk = !ticket && selectedTicketIds.length > 0;
  const count = ticket ? 1 : selectedTicketIds.length;

  useEffect(() => {
    if (ticket) {
      setBuyerName(ticket.buyerName || '');
      setSolicitorName(ticket.solicitorName || '');
    } else {
      setBuyerName('');
      setSolicitorName('');
    }
  }, [ticket, isOpen]);

  if (!isOpen || (!ticket && selectedTicketIds.length === 0)) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!buyerName.trim()) {
      toast.error('Buyer Name is required to mark as Sold.');
      return;
    }

    const trimmedBuyer = buyerName.trim();
    const trimmedSolicitor = solicitorName.trim();
    const now = new Date().toISOString();

    if (ticket) {
      ticketsRepository.update(ticket.id, {
        buyerName: trimmedBuyer,
        ...(trimmedSolicitor ? { solicitorName: trimmedSolicitor } : {}),
        status: 'sold',
        soldAt: now,
      });
      toast.success(`Ticket #${ticket.ticketNumber} marked as Sold to ${trimmedBuyer}!`);
    } else if (selectedTicketIds.length > 0) {
      ticketsRepository.updateMany(selectedTicketIds, {
        buyerName: trimmedBuyer,
        ...(trimmedSolicitor ? { solicitorName: trimmedSolicitor } : {}),
        status: 'sold',
        soldAt: now,
      });
      toast.success(`Marked ${selectedTicketIds.length} ticket(s) as Sold to ${trimmedBuyer}!`);
    }

    onSaved();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{ticket ? `Mark Ticket #${ticket.ticketNumber} as Sold` : `Mark ${count} Tickets as Sold`}</span>
        </div>
      }
      description={ticket ? 'Enter buyer details to complete this ticket sale.' : `Apply buyer name and mark ${count} selected tickets as Sold.`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NameSelectorInput
          label="Buyer Name *"
          placeholder="e.g. Maria Santos"
          value={buyerName}
          onChange={setBuyerName}
          category="buyer"
          raffleId={ticket?.raffleId}
          helperText="Required. The buyer/donor purchasing the ticket(s)."
          required
          autoFocus
        />

        <NameSelectorInput
          label="Solicitor Name (Optional)"
          placeholder="e.g. Juan Dela Cruz"
          value={solicitorName}
          onChange={setSolicitorName}
          category="solicitor"
          raffleId={ticket?.raffleId}
          helperText="Optional. Leave blank to preserve existing solicitor assignments."
        />

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
            Confirm Sale
          </Button>
        </div>
      </form>
    </Modal>
  );
};
