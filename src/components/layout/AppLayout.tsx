import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { MobileNav } from './MobileNav';
import { useAuth } from '../../context/AuthContext';
import { rafflesRepository } from '../../services/storage/rafflesRepository';
import { bookletsRepository } from '../../services/storage/bookletsRepository';
import { printSetsRepository } from '../../services/storage/printSetsRepository';
import { ticketsRepository } from '../../services/storage/ticketsRepository';
import { Raffle } from '../../types/raffle';

const SIDEBAR_COLLAPSED_KEY = 'rafflepro_sidebar_collapsed';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  // Determine active raffle event from current URL or Manager user session
  const activeRaffle = useMemo<Raffle | null>(() => {
    const { pathname, search } = location;

    // Check query params (?raffleId=xxx)
    const searchParams = new URLSearchParams(search);
    const queryRaffleId = searchParams.get('raffleId');
    if (queryRaffleId) {
      const found = rafflesRepository.getById(queryRaffleId);
      if (found) return found;
    }

    // Check pathname: /raffles/:raffleId (excluding /raffles/create and /raffles)
    if (pathname.startsWith('/raffles/') && !pathname.startsWith('/raffles/create')) {
      const parts = pathname.split('/');
      const raffleId = parts[2];
      if (raffleId) {
        const found = rafflesRepository.getById(raffleId);
        if (found) return found;
      }
    }

    // Check pathname: /booklets/:bookletId
    if (pathname.startsWith('/booklets/') && pathname !== '/booklets') {
      const bookletId = pathname.split('/')[2];
      const booklet = bookletsRepository.getById(bookletId);
      if (booklet) {
        const found = rafflesRepository.getById(booklet.raffleId);
        if (found) return found;
      }
    }

    // Check pathname: /print-sets/:setId
    if (pathname.startsWith('/print-sets/') && pathname !== '/print-sets') {
      const setId = pathname.split('/')[2];
      const set = printSetsRepository.getById(setId);
      if (set) {
        const found = rafflesRepository.getById(set.raffleId);
        if (found) return found;
      }
    }

    // Check pathname: /tickets/:ticketId
    if (pathname.startsWith('/tickets/') && pathname !== '/tickets') {
      const ticketId = pathname.split('/')[2];
      const ticket = ticketsRepository.getById(ticketId);
      if (ticket) {
        const found = rafflesRepository.getById(ticket.raffleId);
        if (found) return found;
      }
    }

    // Manager role fallback
    if (user?.role === 'manager' && user.raffleId) {
      const found = rafflesRepository.getById(user.raffleId);
      if (found) return found;
    }

    return null;
  }, [location.pathname, location.search, user]);

  const isEventOpen = !!activeRaffle;
  const sidebarWidth = isEventOpen ? (collapsed ? 'lg:pl-16' : 'lg:pl-64') : 'lg:pl-0';

  return (
    <div className={`min-h-screen bg-[#F8F8F7] flex flex-col transition-all duration-300 ${sidebarWidth}`}>
      {/* Sidebar — ONLY rendered when a raffle event is opened */}
      {isEventOpen && (
        <Sidebar
          isOpen={mobileOpen}
          collapsed={collapsed}
          onClose={() => setMobileOpen(false)}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          activeRaffle={activeRaffle}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        <TopHeader
          onToggleSidebar={() => setMobileOpen(true)}
          sidebarCollapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          isEventOpen={isEventOpen}
          activeRaffle={activeRaffle}
        />
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 w-full ${!isEventOpen ? 'max-w-7xl mx-auto' : ''}`}>
          <Outlet />
        </main>
      </div>

      {/* Bottom Nav for Mobile */}
      {isEventOpen && <MobileNav />}
    </div>
  );
};
