import React, { useState } from 'react';
import { CameraScanner } from '../components/scanner/CameraScanner';
import { ScanResultCard } from '../components/scanner/ScanResultCard';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { settingsRepository } from '../services/storage/settingsRepository';
import { qrService } from '../services/qr/qrService';
import { Ticket } from '../types/ticket';
import { Raffle } from '../types/raffle';
import { Booklet } from '../types/booklet';
import { useToast } from '../context/ToastContext';
import { QrCode } from 'lucide-react';

export const ScanPage: React.FC = () => {
  const toast = useToast();
  const [scannedTicket, setScannedTicket] = useState<Ticket | null>(null);
  const [ticketRaffle, setTicketRaffle] = useState<Raffle | null>(null);
  const [ticketBooklet, setTicketBooklet] = useState<Booklet | null>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [hasResult, setHasResult] = useState(false);

  const handleScanSuccess = (rawData: string) => {
    // 1. Try to extract ticket UUID from QR payload raffle://ticket/{UUID}
    const ticketId = qrService.extractTicketId(rawData);

    let ticket: Ticket | null = null;
    if (ticketId) {
      ticket = ticketsRepository.getByQrUuid(ticketId);
    }

    // Fallback: If user entered ticket number directly (e.g. 0003 or 3)
    if (!ticket) {
      // Search all tickets by ticket number
      const all = ticketsRepository.getAll();
      ticket = all.find(
        (t) =>
          t.ticketNumber.toLowerCase() === rawData.toLowerCase().trim() ||
          String(t.ticketSequence) === rawData.trim()
      ) || null;
    }

    if (ticket) {
      const raffle = rafflesRepository.getById(ticket.raffleId);
      const booklet = bookletsRepository.getById(ticket.bookletId);
      setScannedTicket(ticket);
      setTicketRaffle(raffle);
      setTicketBooklet(booklet);
      setIsInvalid(false);
      setHasResult(true);

      if (ticket.status === 'used') {
        toast.warning(`Ticket #${ticket.ticketNumber} was already admitted!`);
      } else if (ticket.status === 'cancelled') {
        toast.error(`Ticket #${ticket.ticketNumber} is cancelled and void!`);
      } else {
        toast.success(`Verified Ticket #${ticket.ticketNumber}!`);
      }
    } else {
      setScannedTicket(null);
      setIsInvalid(true);
      setHasResult(true);
      toast.error('Invalid or unrecognized ticket code.');
    }
  };

  const handleMarkUsed = (ticket: Ticket) => {
    const now = new Date().toISOString();
    const updated = ticketsRepository.update(ticket.id, {
      status: 'used',
      usedAt: now,
    });
    if (updated) {
      setScannedTicket(updated);
      settingsRepository.addActivity({
        type: 'ticket_used',
        title: `Admitted Ticket #${ticket.ticketNumber}`,
        description: `Marked as Used for ${ticketRaffle?.raffleName || 'Raffle Draw'}.`,
        ticketNumber: ticket.ticketNumber,
      });
      toast.success(`Ticket #${ticket.ticketNumber} marked as Used! Welcome to the draw.`);
    }
  };

  const handleScanAnother = () => {
    setHasResult(false);
    setScannedTicket(null);
    setIsInvalid(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center mx-auto border border-orange-200 shadow-xs mb-2">
          <QrCode className="w-5 h-5" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">Ticket Scanner</h2>
        <p className="text-xs sm:text-sm text-[#6B7280]">
          Scan QR codes using camera, upload images, or enter ticket numbers to verify authenticity and admission status.
        </p>
      </div>

      {!hasResult ? (
        <CameraScanner onScanSuccess={handleScanSuccess} />
      ) : (
        <ScanResultCard
          ticket={scannedTicket}
          raffle={ticketRaffle}
          booklet={ticketBooklet}
          isInvalid={isInvalid}
          onMarkUsed={handleMarkUsed}
          onScanAnother={handleScanAnother}
        />
      )}
    </div>
  );
};
