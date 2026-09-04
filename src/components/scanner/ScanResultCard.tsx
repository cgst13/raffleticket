import React from 'react';
import { Ticket } from '../../types/ticket';
import { Raffle } from '../../types/raffle';
import { Booklet } from '../../types/booklet';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ticketFormatter } from '../../services/tickets/ticketFormatter';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  UserCheck,
  User,
  RotateCcw,
} from 'lucide-react';

interface ScanResultCardProps {
  ticket: Ticket | null;
  raffle: Raffle | null;
  booklet: Booklet | null;
  isInvalid: boolean;
  onMarkUsed: (ticket: Ticket) => void;
  onScanAnother: () => void;
}

export const ScanResultCard: React.FC<ScanResultCardProps> = ({
  ticket,
  raffle,
  booklet,
  isInvalid,
  onMarkUsed,
  onScanAnother,
}) => {
  if (isInvalid || !ticket) {
    return (
      <Card className="border-red-300 bg-red-50/40 p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
          <XCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-black text-red-700 uppercase tracking-wide">INVALID TICKET</h3>
          <p className="text-xs text-red-600 mt-1">
            This QR code is not recognized in the RafflePro database or belongs to a different system.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onScanAnother} leftIcon={<RotateCcw className="w-4 h-4" />}>
          Scan Another Code
        </Button>
      </Card>
    );
  }

  const isUsed = ticket.status === 'used';
  const isCancelled = ticket.status === 'cancelled';
  const isValid = !isUsed && !isCancelled;

  const resolvedSol = ticket.solicitorName || booklet?.solicitorName || 'Unassigned';
  const resolvedBuy = ticket.buyerName || booklet?.buyerName || 'Unassigned';

  return (
    <Card
      className={`border-2 shadow-lg transition-all ${
        isValid
          ? 'border-emerald-500 bg-emerald-50/20'
          : isUsed
          ? 'border-blue-500 bg-blue-50/20'
          : 'border-red-500 bg-red-50/20'
      }`}
    >
      {/* Banner */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#E5E5E5]">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            isValid
              ? 'bg-emerald-100 text-emerald-700'
              : isUsed
              ? 'bg-blue-100 text-blue-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {isValid ? (
            <CheckCircle2 className="w-7 h-7" />
          ) : isUsed ? (
            <Clock className="w-7 h-7" />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>

        <div>
          <h3
            className={`text-lg font-black tracking-tight ${
              isValid ? 'text-emerald-800' : isUsed ? 'text-blue-800' : 'text-red-800'
            }`}
          >
            {isValid ? 'VALID TICKET' : isUsed ? 'TICKET ALREADY USED' : 'CANCELLED TICKET'}
          </h3>
          <p className="text-xs text-neutral-500">
            {isValid
              ? 'Verified authentic ticket. Ready for draw admission.'
              : isUsed
              ? `Admitted on ${ticketFormatter.formatDateTime(ticket.usedAt)}`
              : 'This ticket has been cancelled and is void.'}
          </p>
        </div>
      </div>

      {/* Ticket Details Grid */}
      <div className="py-4 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-neutral-500 font-medium">Ticket Number:</span>
          <span className="font-mono font-black text-base text-[#111111]">#{ticket.ticketNumber}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-neutral-500 font-medium">Raffle Event:</span>
          <span className="font-semibold text-neutral-900 text-right truncate max-w-[200px]">
            {raffle?.raffleName || 'Raffle Event'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-neutral-500 font-medium">Booklet:</span>
          <span className="font-semibold text-neutral-800">
            Booklet #{booklet ? String(booklet.bookletNumber).padStart(3, '0') : '—'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-neutral-500 font-medium">Ticket Amount:</span>
          <span className="font-bold text-neutral-900">{ticketFormatter.formatCurrency(ticket.amount)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-neutral-500 font-medium flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>Solicitor:</span>
          </span>
          <span className="font-semibold text-neutral-800">{resolvedSol}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-neutral-500 font-medium flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-emerald-500" />
            <span>Buyer:</span>
          </span>
          <span className="font-semibold text-neutral-800">{resolvedBuy}</span>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-[#E5E5E5]">
          <span className="text-neutral-500 font-medium">Current Status:</span>
          <Badge status={ticket.status}>{ticket.status}</Badge>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#E5E5E5]">
        <Button variant="outline" size="sm" onClick={onScanAnother} leftIcon={<RotateCcw className="w-4 h-4" />}>
          Scan Next
        </Button>

        {isValid && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onMarkUsed(ticket)}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Mark as Used
          </Button>
        )}
      </div>
    </Card>
  );
};
