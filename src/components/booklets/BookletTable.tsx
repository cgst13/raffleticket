import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Booklet } from '../../types/booklet';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { BookletAssignModal } from './BookletAssignModal';
import { BookletMarkSoldModal } from './BookletMarkSoldModal';
import {
  UserCheck,
  CheckCircle2,
  Eye,
  BookOpen,
  CheckSquare,
  Square,
  Users,
  DollarSign,
  X,
} from 'lucide-react';

interface BookletTableProps {
  booklets: Booklet[];
  onAssign?: (booklet: Booklet) => void;
  onMarkSold?: (booklet: Booklet) => void;
  onView?: (booklet: Booklet) => void;
  onSaved?: () => void;
  onBulkAssign?: (selectedIds: string[]) => void;
  onBulkMarkSold?: (selectedIds: string[]) => void;
}

export const BookletTable: React.FC<BookletTableProps> = ({
  booklets,
  onAssign,
  onMarkSold,
  onView,
  onSaved,
  onBulkAssign,
  onBulkMarkSold,
}) => {
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [internalAssignIds, setInternalAssignIds] = useState<string[]>([]);
  const [internalSoldIds, setInternalSoldIds] = useState<string[]>([]);

  // Selection handlers
  const allIds = useMemo(() => booklets.map((b) => b.id), [booklets]);
  const isAllSelected = booklets.length > 0 && selectedIds.length === booklets.length;
  const isSomeSelected = selectedIds.length > 0 && selectedIds.length < booklets.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(allIds);
    }
  };

  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleView = (b: Booklet) => {
    if (onView) {
      onView(b);
    } else {
      navigate(`/booklets/${b.id}`);
    }
  };

  const handleTriggerBulkAssign = () => {
    if (selectedIds.length === 0) return;
    if (onBulkAssign) {
      onBulkAssign(selectedIds);
    } else {
      setInternalAssignIds(selectedIds);
    }
  };

  const handleTriggerBulkMarkSold = () => {
    if (selectedIds.length === 0) return;
    if (onBulkMarkSold) {
      onBulkMarkSold(selectedIds);
    } else {
      setInternalSoldIds(selectedIds);
    }
  };

  const handleRefresh = () => {
    setSelectedIds([]);
    setInternalAssignIds([]);
    setInternalSoldIds([]);
    onSaved?.();
  };

  const selectedTicketsCount = useMemo(() => {
    const selectedBooklets = booklets.filter((b) => selectedIds.includes(b.id));
    return selectedBooklets.reduce((sum, b) => sum + b.totalTickets, 0);
  }, [booklets, selectedIds]);

  return (
    <div className="space-y-3">
      {/* BULK SELECTION ACTION BAR */}
      {selectedIds.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#F97316] text-white flex items-center justify-center font-bold text-xs">
              {selectedIds.length}
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900">
                {selectedIds.length} Booklet{selectedIds.length === 1 ? '' : 's'} Selected
              </p>
              <p className="text-[11px] text-neutral-600">
                Covers <strong>{selectedTicketsCount}</strong> total tickets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTriggerBulkAssign}
              className="bg-white hover:bg-orange-100/50 border-orange-300 text-neutral-800 text-xs"
              leftIcon={<Users className="w-3.5 h-3.5 text-[#F97316]" />}
            >
              Assign Solicitor ({selectedIds.length})
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleTriggerBulkMarkSold}
              className="bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-xs"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            >
              Mark as Sold ({selectedIds.length})
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds([])}
              className="text-neutral-500 hover:text-neutral-900 p-1.5"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* DESKTOP / LAPTOP TABLE VIEW (Hidden on small screens) */}
      <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-neutral-200 shadow-sm">
        <table className="w-full text-left text-xs text-neutral-600">
          <thead className="bg-neutral-50 text-[11px] font-bold text-neutral-500 uppercase tracking-wider border-b border-neutral-200 select-none">
            <tr>
              <th className="py-3 px-3 w-10 text-center">
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="p-1 text-neutral-400 hover:text-[#F97316] transition-colors rounded"
                  title={isAllSelected ? 'Deselect all' : 'Select all'}
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4 text-[#F97316]" />
                  ) : isSomeSelected ? (
                    <div className="w-4 h-4 rounded border-2 border-[#F97316] bg-orange-100 flex items-center justify-center">
                      <div className="w-2 h-0.5 bg-[#F97316]" />
                    </div>
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-3 px-4">Booklet #</th>
              <th className="py-3 px-4">Ticket Range</th>
              <th className="py-3 px-4 text-center">Tickets</th>
              <th className="py-3 px-4">Assigned Solicitor</th>
              <th className="py-3 px-4">Buyer Info</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {booklets.map((b) => {
              const hasSolicitor = !!b.solicitorName;
              const hasBuyer = !!b.buyerName;
              const isSelected = selectedIds.includes(b.id);

              return (
                <tr
                  key={b.id}
                  onClick={() => handleToggleSelect(b.id)}
                  className={`transition-colors cursor-pointer ${
                    isSelected ? 'bg-orange-50/60 hover:bg-orange-50' : 'hover:bg-orange-50/30'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(b.id)}
                      className="p-1 text-neutral-400 hover:text-[#F97316] transition-colors rounded"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[#F97316]" />
                      ) : (
                        <Square className="w-4 h-4 text-neutral-300" />
                      )}
                    </button>
                  </td>

                  {/* Booklet Number */}
                  <td className="py-3 px-4 font-black text-neutral-900 font-mono">
                    Booklet #{String(b.bookletNumber).padStart(3, '0')}
                  </td>

                  {/* Range */}
                  <td className="py-3 px-4 font-mono font-bold text-[#c2410c] whitespace-nowrap">
                    {b.startTicketNumber} – {b.endTicketNumber}
                  </td>

                  {/* Total Tickets */}
                  <td className="py-3 px-4 text-center font-semibold text-neutral-800 font-mono">
                    {b.totalTickets} pcs
                  </td>

                  {/* Solicitor */}
                  <td className="py-3 px-4">
                    {hasSolicitor ? (
                      <span className="font-semibold text-neutral-800">{b.solicitorName}</span>
                    ) : (
                      <span className="text-neutral-400 italic">Unassigned</span>
                    )}
                  </td>

                  {/* Buyer */}
                  <td className="py-3 px-4">
                    {hasBuyer ? (
                      <span className="font-medium text-neutral-800">{b.buyerName}</span>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <Badge status={b.status}>{b.status}</Badge>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5">
                      {onAssign && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs py-1 px-2.5"
                          onClick={() => onAssign(b)}
                          leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                        >
                          {hasSolicitor ? 'Reassign' : 'Assign'}
                        </Button>
                      )}

                      {onMarkSold && b.status !== 'sold' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs py-1 px-2.5 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                          onClick={() => onMarkSold(b)}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        >
                          Mark Sold
                        </Button>
                      )}

                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs py-1 px-2.5"
                        onClick={() => handleView(b)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        View
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARD VIEW (Only on small screens) */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {booklets.map((b) => {
          const isSelected = selectedIds.includes(b.id);
          return (
            <div
              key={b.id}
              onClick={() => handleToggleSelect(b.id)}
              className={`p-4 rounded-xl border transition-all space-y-3 cursor-pointer ${
                isSelected
                  ? 'border-[#F97316] bg-orange-50/40 ring-1 ring-[#F97316]'
                  : 'border-neutral-200 bg-white shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleSelect(b.id);
                    }}
                    className="p-1 text-neutral-400"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#F97316]" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-300" />
                    )}
                  </button>
                  <h4 className="text-sm font-black text-neutral-900">
                    Booklet #{String(b.bookletNumber).padStart(3, '0')}
                  </h4>
                </div>
                <Badge status={b.status}>{b.status}</Badge>
              </div>

              <div className="text-base font-mono font-black text-[#c2410c]">
                {b.startTicketNumber} – {b.endTicketNumber}
              </div>

              <div className="space-y-1 text-xs py-2 border-y border-neutral-100">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Solicitor:</span>
                  <span className="font-semibold text-neutral-800">{b.solicitorName || 'Unassigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Buyer:</span>
                  <span className="font-semibold text-neutral-800">{b.buyerName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Tickets:</span>
                  <span className="font-semibold text-neutral-800 font-mono">{b.totalTickets} pcs</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                {onAssign && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => onAssign(b)}
                  >
                    {b.solicitorName ? 'Reassign' : 'Assign'}
                  </Button>
                )}
                {onMarkSold && b.status !== 'sold' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs text-emerald-700 border-emerald-200"
                    onClick={() => onMarkSold(b)}
                  >
                    Sold
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleView(b)}
                >
                  View
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Internal Bulk Modals for fallback / standalone usage */}
      <BookletAssignModal
        selectedBookletIds={internalAssignIds}
        isOpen={internalAssignIds.length > 0}
        onClose={() => setInternalAssignIds([])}
        onSaved={handleRefresh}
      />

      <BookletMarkSoldModal
        selectedBookletIds={internalSoldIds}
        isOpen={internalSoldIds.length > 0}
        onClose={() => setInternalSoldIds([])}
        onSaved={handleRefresh}
      />
    </div>
  );
};
