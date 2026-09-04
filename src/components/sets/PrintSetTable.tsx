import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PrintSet } from '../../types/printSet';
import { Raffle } from '../../types/raffle';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Printer, Eye, Trash2, Calendar, FileText } from 'lucide-react';
import { ticketFormatter } from '../../services/tickets/ticketFormatter';

interface PrintSetTableProps {
  printSets: PrintSet[];
  raffleMap?: Map<string, Raffle>;
  onPrint?: (set: PrintSet) => void;
  onTogglePrinted?: (set: PrintSet, e?: React.MouseEvent) => void;
  onDelete?: (setId: string) => void;
  showRaffleColumn?: boolean;
}

export const PrintSetTable: React.FC<PrintSetTableProps> = ({
  printSets,
  raffleMap,
  onPrint,
  onTogglePrinted,
  onDelete,
  showRaffleColumn = false,
}) => {
  const navigate = useNavigate();

  const handlePrint = (set: PrintSet) => {
    if (onPrint) {
      onPrint(set);
    } else {
      navigate(`/print-sets/${set.id}/preview`);
    }
  };

  return (
    <div className="space-y-4">
      {/* DESKTOP / LAPTOP TABLE VIEW (Hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-neutral-200 shadow-sm">
        <table className="w-full text-left text-xs text-neutral-600">
          <thead className="bg-neutral-50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 select-none">
            <tr>
              <th className="py-3 px-4">Set #</th>
              {showRaffleColumn && <th className="py-3 px-4">Raffle Event</th>}
              <th className="py-3 px-4">Ticket Range</th>
              <th className="py-3 px-4 text-center">Booklets</th>
              <th className="py-3 px-4 text-center">Tickets / Booklet</th>
              <th className="py-3 px-4 text-center">Total Tickets</th>
              <th className="py-3 px-4 text-center">Sheets</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Date Created</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {printSets.map((set) => {
              const raffle = raffleMap?.get(set.raffleId);

              return (
                <tr
                  key={set.id}
                  className="hover:bg-orange-50/30 transition-colors group"
                >
                  {/* Set Number */}
                  <td className="py-3 px-4 font-black text-neutral-900 font-mono">
                    Set #{String(set.setNumber).padStart(3, '0')}
                  </td>

                  {/* Optional Raffle Name */}
                  {showRaffleColumn && (
                    <td className="py-3 px-4 font-semibold text-neutral-800 max-w-[160px] truncate">
                      {raffle?.raffleName || '—'}
                    </td>
                  )}

                  {/* Range */}
                  <td className="py-3 px-4 font-mono font-bold text-[#c2410c] whitespace-nowrap">
                    {set.startingTicketNumber} – {set.endingTicketNumber}
                  </td>

                  {/* Booklets */}
                  <td className="py-3 px-4 text-center font-semibold text-neutral-800 font-mono">
                    {set.totalBooklets}
                  </td>

                  {/* Tickets per booklet */}
                  <td className="py-3 px-4 text-center text-neutral-700 font-mono">
                    {set.ticketsPerBooklet}
                  </td>

                  {/* Total Tickets */}
                  <td className="py-3 px-4 text-center font-bold text-neutral-900 font-mono">
                    {set.totalTickets}
                  </td>

                  {/* Sheets */}
                  <td className="py-3 px-4 text-center text-neutral-600 font-mono">
                    {set.totalPages}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-4">
                    <Badge status={set.status}>{set.status}</Badge>
                  </td>

                  {/* Date */}
                  <td className="py-3 px-4 text-neutral-400 text-[11px] whitespace-nowrap">
                    {ticketFormatter.formatDate(set.createdAt)}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      <Button
                        variant="primary"
                        size="sm"
                        className="font-bold text-xs py-1 px-2.5"
                        onClick={() => handlePrint(set)}
                        leftIcon={<Printer className="w-3.5 h-3.5" />}
                      >
                        Print
                      </Button>

                      {onTogglePrinted && (
                        <button
                          onClick={(e) => onTogglePrinted(set, e)}
                          className={`px-2 py-1 text-[11px] font-semibold rounded border transition-colors ${
                            set.status === 'printed'
                              ? 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          }`}
                          title={set.status === 'printed' ? 'Mark as Unprinted' : 'Mark as Printed'}
                        >
                          {set.status === 'printed' ? 'Unmark' : 'Mark Printed'}
                        </button>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs py-1 px-2"
                        onClick={() => navigate(`/print-sets/${set.id}`)}
                      >
                        Details
                      </Button>

                      {onDelete && (
                        <button
                          onClick={() => onDelete(set.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Print Set"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW (Only displayed on small mobile screens) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {printSets.map((set) => {
          const raffle = raffleMap?.get(set.raffleId);

          return (
            <div
              key={set.id}
              className="p-4 rounded-xl border border-neutral-200 bg-white shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  {showRaffleColumn && raffle && (
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      {raffle.raffleName}
                    </span>
                  )}
                  <h4 className="text-sm font-black text-neutral-900">
                    Set #{String(set.setNumber).padStart(3, '0')}
                  </h4>
                </div>
                <Badge status={set.status}>{set.status}</Badge>
              </div>

              <div className="text-base font-mono font-black text-[#c2410c]">
                {set.startingTicketNumber} – {set.endingTicketNumber}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-neutral-100">
                <div>
                  <span className="text-neutral-400 block text-[10px]">Booklets:</span>
                  <span className="font-semibold text-neutral-800">{set.totalBooklets} ({set.ticketsPerBooklet} ea)</span>
                </div>
                <div>
                  <span className="text-neutral-400 block text-[10px]">Total Tickets:</span>
                  <span className="font-semibold text-neutral-800 font-mono">{set.totalTickets} pcs</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  className="flex-1 font-bold"
                  onClick={() => handlePrint(set)}
                  leftIcon={<Printer className="w-3.5 h-3.5" />}
                >
                  Print
                </Button>
                {onTogglePrinted && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => onTogglePrinted(set, e)}
                    className="text-xs"
                  >
                    {set.status === 'printed' ? 'Unmark' : 'Mark Printed'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/print-sets/${set.id}`)}
                >
                  Details
                </Button>
                {onDelete && (
                  <button
                    onClick={() => onDelete(set.id)}
                    className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Print Set"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
