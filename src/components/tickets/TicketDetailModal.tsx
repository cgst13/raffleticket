import React, { useState, useEffect } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { NameSelectorInput } from '../ui/NameSelectorInput';
import { qrService } from '../../services/qr/qrService';
import { ticketFormatter } from '../../services/tickets/ticketFormatter';
import { ticketsRepository } from '../../services/storage/ticketsRepository';
import { bookletsRepository } from '../../services/storage/bookletsRepository';
import { rafflesRepository } from '../../services/storage/rafflesRepository';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, Ban, QrCode, UserCheck } from 'lucide-react';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const TicketDetailModal: React.FC<TicketDetailModalProps> = ({
  ticket,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [solicitor, setSolicitor] = useState('');
  const [buyer, setBuyer] = useState('');
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  const [soldBuyerName, setSoldBuyerName] = useState('');
  const toast = useToast();

  const booklet = ticket ? bookletsRepository.getById(ticket.bookletId) : null;
  const raffle = ticket ? rafflesRepository.getById(ticket.raffleId) : null;

  useEffect(() => {
    if (ticket) {
      setSolicitor(ticket.solicitorName || '');
      setBuyer(ticket.buyerName || '');
      setSoldBuyerName(ticket.buyerName || booklet?.buyerName || '');
      setIsEditing(false);
      setIsMarkingSold(false);
      qrService.toDataURL(ticket.qrValue, { width: 220, margin: 1 }).then(setQrUrl);
    }
  }, [ticket]);

  if (!ticket) return null;

  const resolvedSolicitor = ticket.solicitorName || booklet?.solicitorName || 'Unassigned';
  const resolvedBuyer = ticket.buyerName || booklet?.buyerName || 'Unassigned';

  const handleStatusChange = (newStatus: TicketStatus) => {
    if (newStatus === 'sold') {
      setIsMarkingSold(true);
      return;
    }

    const updates: Partial<Ticket> = { status: newStatus };
    const now = new Date().toISOString();
    if (newStatus === 'used') updates.usedAt = now;
    if (newStatus === 'assigned') updates.assignedAt = now;

    ticketsRepository.update(ticket.id, updates);
    toast.success(`Ticket #${ticket.ticketNumber} marked as ${newStatus}!`);
    onUpdated();
  };

  const handleConfirmMarkSold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!soldBuyerName.trim()) {
      toast.error('Buyer Name is required to mark ticket as Sold.');
      return;
    }

    const trimmedBuyer = soldBuyerName.trim();
    ticketsRepository.update(ticket.id, {
      buyerName: trimmedBuyer,
      status: 'sold',
      soldAt: new Date().toISOString(),
    });
    toast.success(`Ticket #${ticket.ticketNumber} marked as Sold to ${trimmedBuyer}!`);
    setIsMarkingSold(false);
    onUpdated();
  };

  const handleSaveAssignments = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedSol = solicitor.trim();
    const trimmedBuy = buyer.trim();

    ticketsRepository.update(ticket.id, {
      solicitorName: trimmedSol || undefined,
      buyerName: trimmedBuy || undefined,
      status: ticket.status === 'available' && trimmedSol ? 'assigned' : ticket.status,
    });
    toast.success(`Ticket #${ticket.ticketNumber} assignments saved!`);
    setIsEditing(false);
    onUpdated();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Ticket #{ticket.ticketNumber}</span>
          <Badge status={ticket.status}>{ticket.status}</Badge>
        </div>
      }
      description={raffle?.raffleName || 'Raffle Ticket Information'}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Top Split: QR Code & Key Info */}
        <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl bg-neutral-50 border border-[#E5E5E5]">
          <div className="shrink-0 bg-white p-2 rounded-lg border border-[#E5E5E5] shadow-xs flex flex-col items-center">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-32 h-32 object-contain" />
            ) : (
              <div className="w-32 h-32 flex items-center justify-center text-neutral-400">
                <QrCode className="w-10 h-10" />
              </div>
            )}
            <span className="text-[10px] font-mono text-neutral-400 mt-1 truncate max-w-[130px]">
              {ticket.id.slice(0, 13)}...
            </span>
          </div>

          <div className="flex-1 w-full space-y-2 text-xs">
            <div className="flex justify-between border-b border-[#E5E5E5] pb-1.5">
              <span className="text-neutral-500 font-medium">Ticket Amount:</span>
              <span className="font-bold text-[#111111]">{ticketFormatter.formatCurrency(ticket.amount)}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5E5E5] pb-1.5">
              <span className="text-neutral-500 font-medium">Booklet:</span>
              <span className="font-semibold text-neutral-800">
                Booklet #{booklet ? String(booklet.bookletNumber).padStart(3, '0') : '—'}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#E5E5E5] pb-1.5">
              <span className="text-neutral-500 font-medium">Solicitor:</span>
              <span className="font-semibold text-neutral-800">
                {resolvedSolicitor}
                {ticket.solicitorName && <span className="text-[10px] text-[#F97316] ml-1">(Override)</span>}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#E5E5E5] pb-1.5">
              <span className="text-neutral-500 font-medium">Buyer:</span>
              <span className="font-semibold text-neutral-800">
                {resolvedBuyer}
                {ticket.buyerName && <span className="text-[10px] text-[#F97316] ml-1">(Override)</span>}
              </span>
            </div>
            <div className="flex justify-between text-[11px] text-neutral-400 pt-0.5">
              <span>Created:</span>
              <span>{ticketFormatter.formatDate(ticket.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Edit Individual Assignment Form */}
        {isEditing ? (
          <form onSubmit={handleSaveAssignments} className="space-y-3 p-3.5 bg-orange-50/50 rounded-xl border border-orange-200">
            <div className="text-xs font-bold text-[#c2410c]">Edit Individual Overrides</div>
            <NameSelectorInput
              label="Individual Solicitor Override"
              placeholder="Leave blank to inherit from booklet"
              value={solicitor}
              onChange={setSolicitor}
              category="solicitor"
              raffleId={ticket.raffleId}
            />
            <NameSelectorInput
              label="Individual Buyer Override"
              placeholder="Leave blank to inherit from booklet"
              value={buyer}
              onChange={setBuyer}
              category="buyer"
              raffleId={ticket.raffleId}
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              leftIcon={<UserCheck className="w-3.5 h-3.5" />}
            >
              Edit Solicitor / Buyer Override
            </Button>
          </div>
        )}

        {/* Mark as Sold Form requiring Buyer Name */}
        {isMarkingSold && (
          <form onSubmit={handleConfirmMarkSold} className="space-y-3 p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark Ticket as Sold</span>
            </div>
            <NameSelectorInput
              label="Buyer Name *"
              placeholder="e.g. Maria Santos"
              value={soldBuyerName}
              onChange={setSoldBuyerName}
              category="buyer"
              raffleId={ticket.raffleId}
              helperText="Required. The person who purchased this ticket."
              required
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" type="button" onClick={() => setIsMarkingSold(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 border-emerald-700"
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm Sold
              </Button>
            </div>
          </form>
        )}

        {/* Status Transition Action Buttons */}
        <div className="pt-3 border-t border-[#E5E5E5] space-y-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Ticket Actions
          </span>
          <div className="flex flex-wrap gap-2">
            {ticket.status !== 'sold' && ticket.status !== 'used' && ticket.status !== 'cancelled' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('sold')}
                leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              >
                Mark as Sold
              </Button>
            )}

            {ticket.status !== 'used' && ticket.status !== 'cancelled' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusChange('used')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Mark as Used
              </Button>
            )}

            {ticket.status !== 'cancelled' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleStatusChange('cancelled')}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                leftIcon={<Ban className="w-4 h-4" />}
              >
                Cancel Ticket
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
