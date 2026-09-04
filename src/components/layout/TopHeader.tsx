import React, { useEffect, useState } from 'react';
import {
  Menu,
  QrCode,
  Download,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  Ticket,
  Palette,
  Sparkles,
  Trophy,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Raffle } from '../../types/raffle';
import { appConfig } from '../../config/appConfig';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { supabaseSyncService, SyncStatus } from '../../services/supabase/supabaseSyncService';
import { useToast } from '../../context/ToastContext';

interface TopHeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isEventOpen?: boolean;
  activeRaffle?: Raffle | null;
}

// Map route paths to human-readable breadcrumbs
function getEventSectionName(pathname: string, hash: string): string {
  if (pathname.includes('/design')) return 'Ticket Designer';
  if (pathname.includes('/generate')) return 'Generate Tickets';
  if (pathname.includes('/preview')) return 'Print Preview';
  if (hash === '#booklets' || pathname.startsWith('/booklets')) return 'Booklets';
  if (hash === '#tickets' || pathname.startsWith('/tickets')) return 'Ticket Inventory';
  if (hash === '#printSets' || pathname.startsWith('/print-sets')) return 'Print Sets';
  if (hash === '#sales' || pathname.startsWith('/sales')) return 'Sales Tracker';
  if (hash === '#settings') return 'Settings';
  return 'Event Overview';
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleSidebar,
  sidebarCollapsed = false,
  onToggleCollapse,
  isEventOpen = false,
  activeRaffle = null,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = supabaseSyncService.subscribe((status) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    try {
      await supabaseSyncService.syncAll();
      toast.success('Successfully synchronized with Supabase Cloud Database!');
    } catch (err: any) {
      toast.error(err?.message || 'Sync failed. Please check network connection.');
    } finally {
      setIsManualSyncing(false);
    }
  };

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setCanInstall(false);
    setDeferredPrompt(null);
  };

  const sectionName = getEventSectionName(location.pathname, location.hash);

  const isManager = user?.role === 'manager';

  return (
    <header className="h-16 bg-white border-b border-[#E5E5E5] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 no-print gap-3">
      {/* ── LEFT SECTION ──────────────────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        {isEventOpen ? (
          <>
            {/* Mobile hamburger (only when event is open) */}
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors shrink-0"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop collapse toggle */}
            {onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                className="hidden lg:flex p-2 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors shrink-0"
              >
                {sidebarCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Back to All Events button in header (Admin only) */}
            {!isManager && (
              <button
                onClick={() => navigate('/dashboard')}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-neutral-600 hover:text-[#ea580c] hover:bg-orange-50/80 border border-neutral-200 transition-colors shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#F97316]" />
                <span>All Events</span>
              </button>
            )}

            {/* Active Raffle Breadcrumb */}
            <div className="flex items-center gap-2 min-w-0">
              {!isManager && <span className="text-neutral-300 hidden sm:inline">•</span>}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-[#111111] truncate">
                    {activeRaffle?.raffleName || 'Raffle Event'}
                  </span>
                  {activeRaffle && (
                    <Badge size="sm" status={activeRaffle.status}>
                      {activeRaffle.status}
                    </Badge>
                  )}
                  {isManager && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded hidden sm:inline">
                      Manager
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 font-medium truncate hidden md:block">
                  {sectionName}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Global Admin Dashboard Brand Header */
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F97316] flex items-center justify-center text-white shadow-sm shadow-orange-200 shrink-0">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#111111] tracking-tight flex items-center gap-1.5">
                {appConfig.name}
                <span className="text-[10px] font-bold text-[#F97316] bg-orange-50 border border-orange-200 px-1.5 py-0.5 rounded">
                  PRO
                </span>
              </h1>
              <p className="text-[11px] text-[#6B7280] font-medium hidden sm:block">
                Admin Raffle Events Hub
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT SECTION: ACTIONS ─────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Supabase Cloud Sync Status Pill */}
        <button
          onClick={handleManualSync}
          disabled={isManualSyncing}
          title="Click to manually sync with Supabase Cloud Database"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border ${
            syncStatus === 'synced'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              : syncStatus === 'syncing' || isManualSyncing
              ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
              : 'bg-neutral-100 text-neutral-600 border-neutral-200 hover:bg-neutral-200'
          }`}
        >
          {isManualSyncing || syncStatus === 'syncing' ? (
            <RefreshCw className="w-3 h-3 text-amber-600 animate-spin shrink-0" />
          ) : syncStatus === 'synced' ? (
            <Cloud className="w-3 h-3 text-emerald-600 shrink-0" />
          ) : (
            <CloudOff className="w-3 h-3 text-neutral-500 shrink-0" />
          )}
          <span className="hidden sm:inline">
            {isManualSyncing || syncStatus === 'syncing'
              ? 'Syncing Cloud...'
              : syncStatus === 'synced'
              ? 'Cloud Synced'
              : 'Offline / Local'}
          </span>
        </button>

        {canInstall && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleInstallClick}
            leftIcon={<Download className="w-4 h-4 text-[#F97316]" />}
          >
            <span className="hidden sm:inline">Install App</span>
          </Button>
        )}

        {isEventOpen && activeRaffle ? (
          <>
            {!isManager && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/raffles/${activeRaffle.id}/design`)}
                leftIcon={<Palette className="w-4 h-4 text-[#F97316]" />}
                className="hidden md:inline-flex"
              >
                <span>Designer</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/raffles/${activeRaffle.id}/generate`)}
              leftIcon={<Sparkles className="w-4 h-4 text-[#F97316]" />}
              className="hidden md:inline-flex"
            >
              <span>Generate</span>
            </Button>
          </>
        ) : null}

        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(activeRaffle ? `/scan?raffleId=${activeRaffle.id}` : '/scan')}
          leftIcon={<QrCode className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Scan QR</span>
        </Button>

        {!isManager && (
          <Link to="/raffles/create">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              <span className="hidden sm:inline">Create Raffle</span>
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
