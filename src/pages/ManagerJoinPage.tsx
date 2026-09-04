import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Raffle } from '../types/raffle';
import { appConfig } from '../config/appConfig';
import { ticketFormatter } from '../services/tickets/ticketFormatter';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Ticket,
  Mail,
  ShieldCheck,
  Calendar,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  Lock,
} from 'lucide-react';

import { storageAdapter } from '../services/storage/storageAdapter';

export const ManagerJoinPage: React.FC = () => {
  const { raffleId: paramRaffleId } = useParams<{ raffleId: string }>();
  const [searchParams] = useSearchParams();
  const raffleId = paramRaffleId || searchParams.get('raffleId') || '';

  const navigate = useNavigate();
  const { loginAsManager, user, isAuthenticated } = useAuth();
  const toast = useToast();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [isLoadingRaffle, setIsLoadingRaffle] = useState(true);
  const [email, setEmail] = useState('');
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const findRaffle = async () => {
      setIsLoadingRaffle(true);
      if (raffleId) {
        let found = rafflesRepository.getById(raffleId);
        if (!found && rafflesRepository.fetchByIdFromSupabase) {
          found = await rafflesRepository.fetchByIdFromSupabase(raffleId);
        }
        if (isMounted) {
          if (found) {
            setRaffle(found);
            setErrorMessage(null);
          } else {
            setErrorMessage('Raffle event not found. Please verify your invitation link.');
          }
          setIsLoadingRaffle(false);
        }
      } else {
        const all = rafflesRepository.getAll();
        if (all.length > 0) {
          if (isMounted) {
            setRaffle(all[0]);
            setErrorMessage(null);
            setIsLoadingRaffle(false);
          }
        } else {
          if (isMounted) {
            setErrorMessage('No raffle events currently available.');
            setIsLoadingRaffle(false);
          }
        }
      }
    };

    findRaffle();

    const unsubscribe = storageAdapter.subscribe(() => {
      findRaffle();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [raffleId]);

  // If already logged in as manager for this event, navigate straight to Generate Tickets
  useEffect(() => {
    if (isAuthenticated && user?.role === 'manager' && raffle && user.raffleId === raffle.id) {
      navigate(`/raffles/${raffle.id}/generate`, { replace: true });
    }
  }, [isAuthenticated, user, raffle, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raffle) {
      setErrorMessage('No active raffle event selected.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your manager email address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await loginAsManager(raffle.id, trimmedEmail, keepLoggedIn);
      if (res.success) {
        toast.success(`Welcome! Logged in as Manager for ${raffle.raffleName}`);
        navigate(`/raffles/${raffle.id}/generate`);
      } else {
        setErrorMessage(res.error || 'Failed to authenticate. Please check your email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-100 via-[#F8F8F7] to-orange-50/40 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#F97316] text-white shadow-lg shadow-orange-200 mb-1">
            <Ticket className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
            {appConfig.name} <span className="text-[#F97316]">Manager Portal</span>
          </h1>
          <p className="text-xs text-neutral-500">
            Secure event access for authorized managers & staff
          </p>
        </div>

        {/* Event Card & Form */}
        <Card className="p-6 sm:p-7 shadow-xl border-neutral-200/80 bg-white space-y-5">
          {isLoadingRaffle ? (
            <div className="p-4 text-center text-xs font-semibold text-neutral-400 animate-pulse">
              Finding raffle event details...
            </div>
          ) : raffle ? (
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-orange-50/80 to-amber-50/40 border border-orange-200/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c] flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5" />
                  Invited Event
                </span>
                <span className="text-[11px] font-bold text-neutral-600">
                  {ticketFormatter.formatCurrency(raffle.ticketAmount)} / ticket
                </span>
              </div>
              <h2 className="text-sm font-black text-neutral-900 leading-snug">
                {raffle.raffleName}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 font-medium">
                <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Draw Date: {ticketFormatter.formatDate(raffle.drawDate)}</span>
              </div>
            </div>
          ) : null}

          {!isLoadingRaffle && errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                Manager Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="manager@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent text-neutral-900 placeholder:text-neutral-400"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-neutral-400 mt-1.5">
                Requires email registered by the event administrator. No password required.
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#F97316] focus:ring-[#F97316] accent-[#F97316] cursor-pointer"
                />
                <span className="text-xs font-semibold text-neutral-700">Keep me logged in</span>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold shadow-md shadow-orange-100"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Access Event
            </Button>
          </form>

          {/* Manager Access Info */}
          <div className="pt-4 border-t border-neutral-100 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Manager Access Includes:</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-neutral-600 pl-6">
              <div>✨ Generate Tickets</div>
              <div>📖 Booklets</div>
              <div>🎟 Ticket Inventory</div>
              <div>🖨 Print Sets</div>
              <div className="col-span-2">🔲 QR Scanner</div>
            </div>
          </div>
        </Card>

        {/* Footer Admin Link */}
        <div className="text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
          >
            Are you the System Administrator? <span className="text-[#F97316] underline">Admin Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
