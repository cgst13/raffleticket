import React, { useState, useMemo } from 'react';
import { Ticket, TicketStatus } from '../../types/ticket';
import { Booklet } from '../../types/booklet';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ticketFormatter } from '../../services/tickets/ticketFormatter';
import {
  Search,
  CheckSquare,
  Square,
  Eye,
  Filter,
  Users,
  CheckCircle2,
  Ban,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface TicketTableProps {
  tickets: Ticket[];
  booklets: Booklet[];
  onViewTicket: (ticket: Ticket) => void;
  onBulkAssign: (selectedIds: string[]) => void;
  onBulkStatusChange: (selectedIds: string[], status: TicketStatus) => void;
}

export const TicketTable: React.FC<TicketTableProps> = ({
  tickets,
  booklets,
  onViewTicket,
  onBulkAssign,
  onBulkStatusChange,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Pre-index booklets for fast lookups
  const bookletMap = useMemo(() => {
    const map = new Map<string, Booklet>();
    booklets.forEach((b) => map.set(b.id, b));
    return map;
  }, [booklets]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    let result = tickets;

    if (statusFilter !== 'all') {
      result = result.filter((t) => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((t) => {
        const booklet = bookletMap.get(t.bookletId);
        const resolvedSol = (t.solicitorName || booklet?.solicitorName || '').toLowerCase();
        const resolvedBuy = (t.buyerName || booklet?.buyerName || '').toLowerCase();
        const num = t.ticketNumber.toLowerCase();
        const bNum = booklet ? String(booklet.bookletNumber) : '';

        return (
          num.includes(q) ||
          resolvedSol.includes(q) ||
          resolvedBuy.includes(q) ||
          bNum.includes(q)
        );
      });
    }

    return result;
  }, [tickets, statusFilter, searchQuery, bookletMap]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  // Selection handlers
  const handleSelectAllCurrent = () => {
    const pageIds = paginatedTickets.map((t) => t.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by ticket #, buyer, solicitor, or booklet..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          >
            <option value="all">All Statuses ({tickets.length})</option>
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="sold">Sold</option>
            <option value="used">Used</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when tickets are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-xl animate-in fade-in">
          <div className="text-xs font-semibold text-[#c2410c] flex items-center gap-2">
            <span>{selectedIds.length} ticket(s) selected</span>
            <button
              onClick={() => setSelectedIds([])}
              className="text-neutral-500 hover:underline font-normal text-[11px]"
            >
              Clear
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onBulkAssign(selectedIds)}
              leftIcon={<Users className="w-3.5 h-3.5" />}
            >
              Assign
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkStatusChange(selectedIds, 'sold')}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Mark Sold
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBulkStatusChange(selectedIds, 'cancelled')}
              className="text-red-600 hover:bg-red-50"
              leftIcon={<Ban className="w-3.5 h-3.5" />}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-xl border border-[#E5E5E5] overflow-x-auto shadow-xs">
        <table className="w-full min-w-[640px] text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E5E5] bg-neutral-50/70 text-neutral-600">
              <th className="p-3 w-10 text-center">
                <button
                  onClick={handleSelectAllCurrent}
                  className="text-neutral-400 hover:text-neutral-700"
                  aria-label="Select all on page"
                >
                  {paginatedTickets.length > 0 &&
                  paginatedTickets.every((t) => selectedIds.includes(t.id)) ? (
                    <CheckSquare className="w-4 h-4 text-[#F97316]" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Ticket #</th>
              <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Booklet</th>
              <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Solicitor</th>
              <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Buyer</th>
              <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Amount</th>
              <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Status</th>
              <th className="p-3 font-semibold uppercase tracking-wider text-[11px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {paginatedTickets.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-neutral-400">
                  No tickets match your search filters.
                </td>
              </tr>
            ) : (
              paginatedTickets.map((t) => {
                const isSelected = selectedIds.includes(t.id);
                const booklet = bookletMap.get(t.bookletId);
                const resolvedSol = t.solicitorName || booklet?.solicitorName || '—';
                const resolvedBuy = t.buyerName || booklet?.buyerName || '—';

                return (
                  <tr
                    key={t.id}
                    className={`hover:bg-neutral-50/60 transition-colors ${
                      isSelected ? 'bg-orange-50/30' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleSelect(t.id)}
                        className="text-neutral-400 hover:text-neutral-700"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#F97316]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="p-3 font-mono font-bold text-neutral-900">
                      {t.ticketNumber}
                    </td>
                    <td className="p-3 text-neutral-600">
                      {booklet ? `#${String(booklet.bookletNumber).padStart(3, '0')}` : '—'}
                    </td>
                    <td className="p-3 font-medium text-neutral-800">
                      <span className="truncate max-w-[130px] block">
                        {resolvedSol}
                        {t.solicitorName && (
                          <span className="text-[10px] text-[#F97316] ml-1 font-semibold">*</span>
                        )}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-neutral-800">
                      <span className="truncate max-w-[130px] block">
                        {resolvedBuy}
                        {t.buyerName && (
                          <span className="text-[10px] text-[#F97316] ml-1 font-semibold">*</span>
                        )}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-neutral-900">
                      {ticketFormatter.formatCurrency(t.amount)}
                    </td>
                    <td className="p-3">
                      <Badge status={t.status}>{t.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewTicket(t)}
                        title="View / Edit Ticket"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
        {paginatedTickets.map((t) => {
          const isSelected = selectedIds.includes(t.id);
          const booklet = bookletMap.get(t.bookletId);
          const resolvedSol = t.solicitorName || booklet?.solicitorName || 'Unassigned';
          const resolvedBuy = t.buyerName || booklet?.buyerName || 'Unassigned';

          return (
            <div
              key={t.id}
              className={`p-4 bg-white rounded-xl border transition-all ${
                isSelected ? 'border-[#F97316] bg-orange-50/20' : 'border-[#E5E5E5]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleSelect(t.id)}
                    className="text-neutral-400"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#F97316]" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  <span className="font-mono font-bold text-sm text-[#111111]">
                    {t.ticketNumber}
                  </span>
                </div>
                <Badge status={t.status}>{t.status}</Badge>
              </div>

              <div className="space-y-1 text-xs text-neutral-600 mb-3">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Booklet:</span>
                  <span>{booklet ? `#${String(booklet.bookletNumber).padStart(3, '0')}` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Solicitor:</span>
                  <span className="font-medium text-neutral-800 truncate max-w-[150px]">{resolvedSol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Buyer:</span>
                  <span className="font-medium text-neutral-800 truncate max-w-[150px]">{resolvedBuy}</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#E5E5E5]">
                <span className="font-bold text-neutral-900 text-xs">
                  {ticketFormatter.formatCurrency(t.amount)}
                </span>
                <Button variant="outline" size="sm" onClick={() => onViewTicket(t)}>
                  View Details
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between pt-2 text-xs text-neutral-500">
        <div>
          Showing {filteredTickets.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredTickets.length)} of {filteredTickets.length} tickets
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="px-2 font-mono font-medium">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
