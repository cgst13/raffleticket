import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { Booklet } from '../types/booklet';
import { BookletCard } from '../components/booklets/BookletCard';
import { BookletTable } from '../components/booklets/BookletTable';
import { BookletAssignModal } from '../components/booklets/BookletAssignModal';
import { BookletMarkSoldModal } from '../components/booklets/BookletMarkSoldModal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../context/ToastContext';
import { BookOpen, Filter, Search } from 'lucide-react';

export const BookletsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [booklets, setBooklets] = useState<Booklet[]>(bookletsRepository.getAll());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBooklet, setSelectedBooklet] = useState<Booklet | null>(null);
  const [soldBooklet, setSoldBooklet] = useState<Booklet | null>(null);

  const raffles = rafflesRepository.getAll();
  const [raffleFilter, setRaffleFilter] = useState<string>('all');

  const refreshBooklets = () => {
    setBooklets(bookletsRepository.getAll());
  };

  const filteredBooklets = booklets.filter((b) => {
    if (raffleFilter !== 'all' && b.raffleId !== raffleFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(b.bookletNumber).includes(q) ||
      b.startTicketNumber.toLowerCase().includes(q) ||
      b.endTicketNumber.toLowerCase().includes(q) ||
      (b.solicitorName && b.solicitorName.toLowerCase().includes(q)) ||
      (b.buyerName && b.buyerName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">Booklets</h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Manage sequential ticket booklets, assign solicitors, and track distribution.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by booklet #, ticket range, solicitor, buyer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          />
        </div>

        {raffles.length > 1 && (
          <select
            value={raffleFilter}
            onChange={(e) => setRaffleFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          >
            <option value="all">All Raffles</option>
            {raffles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.raffleName}
              </option>
            ))}
          </select>
        )}
      </div>

      {booklets.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-8 h-8" />}
          title="No booklets yet"
          description="Generate a ticket set for any raffle to create consecutive ticket booklets."
          actionLabel="Go to Raffles"
          onAction={() => navigate('/raffles')}
        />
      ) : (
        <BookletTable
          booklets={filteredBooklets}
          onAssign={(target) => setSelectedBooklet(target)}
          onMarkSold={(target) => setSoldBooklet(target)}
          onView={(target) => navigate(`/booklets/${target.id}`)}
          onSaved={refreshBooklets}
        />
      )}

      {/* Booklet Assign Modal (Requires Solicitor) */}
      <BookletAssignModal
        booklet={selectedBooklet}
        isOpen={!!selectedBooklet}
        onClose={() => setSelectedBooklet(null)}
        onSaved={refreshBooklets}
      />

      {/* Booklet Mark Sold Modal (Requires Buyer) */}
      <BookletMarkSoldModal
        booklet={soldBooklet}
        isOpen={!!soldBooklet}
        onClose={() => setSoldBooklet(null)}
        onSaved={refreshBooklets}
      />
    </div>
  );
};
