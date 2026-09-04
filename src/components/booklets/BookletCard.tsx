import React from 'react';
import { Booklet } from '../../types/booklet';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BookOpen, UserCheck, User, UserPlus, CheckCircle2 } from 'lucide-react';

interface BookletCardProps {
  booklet: Booklet;
  onAssign: (booklet: Booklet) => void;
  onMarkSold: (booklet: Booklet) => void;
  onView: (booklet: Booklet) => void;
}

export const BookletCard: React.FC<BookletCardProps> = ({
  booklet,
  onAssign,
  onMarkSold,
  onView,
}) => {
  return (
    <Card hover className="flex flex-col justify-between p-4">
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F97316] border border-orange-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#111111]">
                Booklet #{String(booklet.bookletNumber).padStart(3, '0')}
              </h4>
              <p className="text-xs font-mono font-semibold text-[#c2410c]">
                {booklet.startTicketNumber} – {booklet.endTicketNumber}
              </p>
            </div>
          </div>
          <Badge status={booklet.status}>{booklet.status}</Badge>
        </div>

        <div className="space-y-1.5 py-2 border-y border-[#E5E5E5] text-xs">
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Solicitor:</span>
            </span>
            <span className="font-semibold text-neutral-800 truncate max-w-[130px]">
              {booklet.solicitorName || <span className="text-neutral-400 italic">Unassigned</span>}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-neutral-500 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              <span>Buyer:</span>
            </span>
            <span className="font-semibold text-neutral-800 truncate max-w-[130px]">
              {booklet.buyerName || <span className="text-neutral-400 italic">Unassigned</span>}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
            <span>Total Tickets:</span>
            <span className="font-mono font-medium text-neutral-600">{booklet.totalTickets} pcs</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 mt-1">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(booklet)}>
          View
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onAssign(booklet)}
          title="Assign Solicitor & Buyer"
          leftIcon={<UserPlus className="w-3.5 h-3.5" />}
        >
          Assign
        </Button>
        {booklet.status !== 'sold' && booklet.status !== 'completed' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onMarkSold(booklet)}
            title="Mark All Tickets in Booklet as Sold"
            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
          >
            <CheckCircle2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
};
