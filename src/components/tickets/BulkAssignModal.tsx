import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { NameSelectorInput } from '../ui/NameSelectorInput';
import { ticketsRepository } from '../../services/storage/ticketsRepository';
import { useToast } from '../../context/ToastContext';

interface BulkAssignModalProps {
  selectedTicketIds: string[];
  isOpen: boolean;
  onClose: () => void;
  onAssigned: () => void;
}

export const BulkAssignModal: React.FC<BulkAssignModalProps> = ({
  selectedTicketIds,
  isOpen,
  onClose,
  onAssigned,
}) => {
  const [solicitor, setSolicitor] = useState('');
  const [buyer, setBuyer] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTicketIds.length === 0) return;

    if (!solicitor.trim()) {
      toast.error('Solicitor Name is required to assign tickets.');
      return;
    }

    const trimmedSolicitor = solicitor.trim();
    const trimmedBuyer = buyer.trim();
    const tickets = selectedTicketIds.map((id) => ticketsRepository.getById(id)).filter(Boolean);

    let updatedCount = 0;
    for (const t of tickets) {
      if (!t) continue;
      const updates: any = {};
      if (trimmedSolicitor && (overwrite || !t.solicitorName)) {
        updates.solicitorName = trimmedSolicitor;
      }
      if (trimmedBuyer && (overwrite || !t.buyerName)) {
        updates.buyerName = trimmedBuyer;
      }
      if (t.status === 'available') {
        updates.status = 'assigned';
        updates.assignedAt = new Date().toISOString();
      }
      ticketsRepository.update(t.id, updates);
      updatedCount++;
    }

    toast.success(`Assigned ${updatedCount} ticket(s) to ${trimmedSolicitor}!`);
    onAssigned();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bulk Assign (${selectedTicketIds.length} Tickets)`}
      description="Apply solicitor and buyer details to all selected tickets."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <NameSelectorInput
          label="Solicitor Name *"
          placeholder="e.g. Juan Dela Cruz"
          value={solicitor}
          onChange={setSolicitor}
          category="solicitor"
          helperText="Required. The solicitor/agent assigned to these tickets."
          required
          autoFocus
        />

        <NameSelectorInput
          label="Buyer Name (Optional)"
          placeholder="e.g. Maria Santos"
          value={buyer}
          onChange={setBuyer}
          category="buyer"
          helperText="Optional default buyer name for selected tickets."
        />

        <div className="pt-2 border-t border-[#E5E5E5]">
          <label className="flex items-start gap-2 text-xs text-neutral-600 cursor-pointer">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="mt-0.5 rounded border-neutral-300 text-[#F97316] focus:ring-[#F97316]"
            />
            <span>
              <strong>Overwrite existing values</strong> (if unchecked, existing solicitor/buyer names on tickets won't be replaced).
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit">
            Apply to {selectedTicketIds.length} Tickets
          </Button>
        </div>
      </form>
    </Modal>
  );
};
