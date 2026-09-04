import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  Printer,
  QrCode,
  Settings,
  LogOut,
  Palette,
  Sparkles,
  Trophy,
  ArrowLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Calendar,
  TrendingUp,
} from 'lucide-react';
import { appConfig } from '../../config/appConfig';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Raffle } from '../../types/raffle';
import { Badge } from '../ui/Badge';
import { ticketFormatter } from '../../services/tickets/ticketFormatter';

interface SidebarProps {
  isOpen: boolean;          // mobile drawer open
  collapsed: boolean;       // desktop collapsed (icon-only)
  onClose?: () => void;
  onToggleCollapse: () => void;
  activeRaffle?: Raffle | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  collapsed,
  onClose,
  onToggleCollapse,
  activeRaffle,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleBackToDashboard = () => {
    if (onClose) onClose();
    navigate('/dashboard');
  };

  const isManager = user?.role === 'manager';
  const raffleId = activeRaffle?.id || user?.raffleId || '';

  // Navigation items for Admin vs Manager
  const allNavItems = [
    {
      to: `/raffles/${raffleId}`,
      exact: true,
      label: 'Event Overview',
      icon: LayoutDashboard,
      adminOnly: true,
      isActiveMatch: (path: string, hash: string) =>
        path === `/raffles/${raffleId}` && (!hash || hash === '#overview'),
    },
    {
      to: `/raffles/${raffleId}/design`,
      label: 'Ticket Designer',
      icon: Palette,
      adminOnly: true,
      isActiveMatch: (path: string) => path === `/raffles/${raffleId}/design`,
    },
    {
      to: `/raffles/${raffleId}/generate`,
      label: 'Generate Tickets',
      icon: Sparkles,
      adminOnly: false,
      isActiveMatch: (path: string) => path === `/raffles/${raffleId}/generate`,
    },
    {
      to: `/raffles/${raffleId}#booklets`,
      label: 'Booklets',
      icon: BookOpen,
      adminOnly: false,
      isActiveMatch: (path: string, hash: string) =>
        (path === `/raffles/${raffleId}` && hash === '#booklets') || path.startsWith('/booklets'),
    },
    {
      to: `/raffles/${raffleId}#tickets`,
      label: 'Ticket Inventory',
      icon: Ticket,
      adminOnly: false,
      isActiveMatch: (path: string, hash: string) =>
        (path === `/raffles/${raffleId}` && hash === '#tickets') || path.startsWith('/tickets'),
    },
    {
      to: `/raffles/${raffleId}#printSets`,
      label: 'Print Sets',
      icon: Printer,
      adminOnly: false,
      isActiveMatch: (path: string, hash: string) =>
        (path === `/raffles/${raffleId}` && hash === '#printSets') || path.startsWith('/print-sets'),
    },
    {
      to: `/scan?raffleId=${raffleId}`,
      label: 'QR Scanner',
      icon: QrCode,
      adminOnly: false,
      isActiveMatch: (path: string) => path.startsWith('/scan'),
    },
    {
      to: `/sales${raffleId ? `?raffleId=${raffleId}` : ''}`,
      label: 'Sales Tracker',
      icon: TrendingUp,
      adminOnly: false,
      isActiveMatch: (path: string, hash: string) =>
        path === '/sales' || (path === `/raffles/${raffleId}` && hash === '#sales'),
    },
    {
      to: `/raffles/${raffleId}#settings`,
      label: 'Event Settings',
      icon: Settings,
      adminOnly: true,
      isActiveMatch: (path: string, hash: string) =>
        path === `/raffles/${raffleId}` && hash === '#settings',
    },
  ];

  const navItems = isManager
    ? allNavItems.filter((item) => !item.adminOnly)
    : allNavItems;

  // Sidebar width — collapsed = 64px icon rail, expanded = 256px
  const desktopWidth = collapsed ? 'lg:w-16' : 'lg:w-64';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-40
          w-64 ${desktopWidth}
          bg-white border-r border-[#E5E5E5]
          flex flex-col
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* ── Return to All Events Button (Admin only) ────────────── */}
        {!isManager && (
          <div className="border-b border-[#E5E5E5] p-2 bg-neutral-50/70">
            <button
              onClick={handleBackToDashboard}
              title={collapsed ? 'Return to All Raffle Events' : undefined}
              className={`w-full flex items-center rounded-lg text-xs font-bold text-neutral-700 hover:text-[#ea580c] hover:bg-orange-50/80 transition-all border border-neutral-200/80 hover:border-orange-300 ${
                collapsed ? 'justify-center p-2.5' : 'gap-2 px-3 py-2'
              }`}
            >
              <ArrowLeft className="w-4 h-4 text-[#F97316] shrink-0" />
              {!collapsed && <span className="truncate">All Raffle Events</span>}
            </button>
          </div>
        )}

        {/* ── Active Event Card Header ───────────────── */}
        {activeRaffle && !collapsed && (
          <div className="p-3.5 border-b border-[#E5E5E5] bg-gradient-to-br from-orange-50/40 to-amber-50/20">
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c] flex items-center gap-1">
                <Trophy className="w-3 h-3" />
                {isManager ? 'Assigned Event' : 'Active Event'}
              </span>
              <Badge status={activeRaffle.status}>{activeRaffle.status}</Badge>
            </div>
            <h2 className="text-xs font-black text-neutral-900 leading-snug line-clamp-2">
              {activeRaffle.raffleName}
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-neutral-500 mt-1 font-medium">
              <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
              <span className="truncate">Draw: {ticketFormatter.formatDate(activeRaffle.drawDate)}</span>
            </div>
          </div>
        )}

        {/* ── Collapsed Event Indicator ──────────────── */}
        {activeRaffle && collapsed && (
          <div className="p-2 border-b border-[#E5E5E5] flex justify-center">
            <div
              title={`${activeRaffle.raffleName} (${activeRaffle.status})`}
              className="w-8 h-8 rounded-lg bg-orange-100 text-[#ea580c] flex items-center justify-center font-bold text-xs shadow-xs"
            >
              <Trophy className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* ── Navigation Items ──────────────────────── */}
        <nav className={`flex-1 py-3 space-y-1 overflow-y-auto ${collapsed ? 'px-1.5' : 'px-3'}`}>
          {!collapsed && (
            <div className="px-2 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              {isManager ? 'Manager Portal' : 'Event Management'}
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isCurrent = item.isActiveMatch(location.pathname, location.hash);

            return (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={`flex items-center rounded-lg font-medium transition-all group relative ${
                  collapsed ? 'justify-center p-3' : 'gap-3 px-3 py-2.5 justify-between'
                } ${
                  isCurrent
                    ? 'bg-orange-50 text-[#ea580c] font-bold shadow-xs border border-orange-200/60'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 border border-transparent'
                }`}
              >
                <div className={`flex items-center ${collapsed ? '' : 'gap-3 min-w-0'}`}>
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isCurrent ? 'text-[#ea580c]' : 'text-neutral-500 group-hover:text-neutral-800'
                    }`}
                  />
                  {!collapsed && <span className="text-xs truncate">{item.label}</span>}
                </div>

                {!collapsed && (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                      isCurrent ? 'text-[#ea580c] opacity-100 translate-x-0.5' : 'opacity-25'
                    }`}
                  />
                )}

                {/* Tooltip for collapsed view */}
                {collapsed && (
                  <span
                    className="
                    pointer-events-none absolute left-full ml-3 top-1/2 -translate-y-1/2
                    whitespace-nowrap px-2.5 py-1.5 rounded-lg
                    bg-neutral-900 text-white text-xs font-semibold
                    shadow-lg opacity-0 group-hover:opacity-100
                    transition-opacity duration-150 z-50
                  "
                  >
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* ── User Footer ───────────────────────────── */}
        <div className={`border-t border-[#E5E5E5] bg-neutral-50/60 shrink-0 ${collapsed ? 'p-2' : 'p-3'}`}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div
                title={user?.fullName || 'User'}
                className="w-8 h-8 rounded-lg bg-neutral-900 text-white font-bold text-xs flex items-center justify-center"
              >
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E5E5]">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold text-[#111111] truncate">{user?.fullName || 'User'}</p>
                  <p className="text-[10px] text-[#6B7280] truncate">
                    {isManager ? 'Event Manager' : `@${user?.username || 'admin'}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Collapse Toggle Button (desktop only) ─── */}
        <button
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`
            hidden lg:flex items-center justify-center
            h-10 border-t border-[#E5E5E5] bg-neutral-50/40
            text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100
            transition-colors shrink-0 w-full
          `}
        >
          {collapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <PanelLeftClose className="w-4 h-4" />
              Collapse Menu
            </span>
          )}
        </button>
      </aside>
    </>
  );
};
