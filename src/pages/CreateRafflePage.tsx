import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Raffle, RaffleStatus } from '../types/raffle';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { designRepository } from '../services/storage/designRepository';
import { printLayoutRepository, getDefaultPrintLayout } from '../services/storage/printLayoutRepository';
import { settingsRepository } from '../services/storage/settingsRepository';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const CreateRafflePage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [raffleName, setRaffleName] = useState('');
  const [eventName, setEventName] = useState('');
  const [ticketName, setTicketName] = useState('');
  const [ticketAmount, setTicketAmount] = useState<number>(100);
  const [drawDate, setDrawDate] = useState('2026-12-20');
  const [drawTime, setDrawTime] = useState('19:00');
  const [venue, setVenue] = useState('Barangay Multi-Purpose Covered Court');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<RaffleStatus>('active');

  const handleFillSample = () => {
    setRaffleName('Barangay Fiesta Grand Raffle 2026');
    setEventName('Barangay Fiesta 2026');
    setTicketName('Grand Raffle Ticket');
    setTicketAmount(100);
    setDrawDate('2026-12-20');
    setDrawTime('19:00');
    setVenue('Barangay Multi-Purpose Covered Court');
    setDescription('Official 2026 Fiesta fundraising grand raffle with brand new motorcycle and appliance prizes.');
    setStatus('active');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!raffleName.trim() || !eventName.trim()) {
      toast.error('Raffle Name and Event Name are required.');
      return;
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const newRaffle: Raffle = {
      id,
      raffleName: raffleName.trim(),
      eventName: eventName.trim(),
      ticketName: ticketName.trim() || 'Raffle Ticket',
      ticketAmount: Number(ticketAmount) || 100,
      drawDate,
      drawTime,
      venue: venue.trim(),
      description: description.trim(),
      status,
      createdAt: now,
      updatedAt: now,
    };

    // 1. Save Raffle
    rafflesRepository.create(newRaffle);

    // 2. Initialize Default Ticket Design
    designRepository.save({
      id: `design_${id}`,
      raffleId: id,
      name: `${newRaffle.raffleName} Template`,
      widthMm: 140,
      heightMm: 50,
      backgroundImageUrl: '/sample-ticket-bg.svg',
      backgroundColor: '#FFFDF9',
      version: 1,
      createdAt: now,
      updatedAt: now,
      elements: [
        {
          id: 'elem_num_1',
          type: 'ticketNumber',
          x: 100,
          y: 38,
          width: 35,
          height: 8,
          rotation: 0,
          opacity: 1,
          zIndex: 10,
          locked: false,
          visible: true,
          style: {
            fontFamily: 'JetBrains Mono',
            fontSize: 20,
            fontWeight: '800',
            color: '#111111',
            alignment: 'right',
            letterSpacing: 1.5,
          },
          numberFormat: { padding: 6, sampleValue: '000001' },
        },
        {
          id: 'elem_stub_num',
          type: 'ticketNumber',
          x: 6,
          y: 40,
          width: 30,
          height: 6,
          rotation: 0,
          opacity: 1,
          zIndex: 9,
          locked: false,
          visible: true,
          style: {
            fontFamily: 'JetBrains Mono',
            fontSize: 14,
            fontWeight: '700',
            color: '#c2410c',
            alignment: 'center',
            letterSpacing: 1,
          },
          numberFormat: { padding: 6, sampleValue: '000001' },
        },
        {
          id: 'elem_qr_1',
          type: 'qrCode',
          x: 114,
          y: 12,
          width: 22,
          height: 22,
          rotation: 0,
          opacity: 1,
          zIndex: 11,
          locked: false,
          visible: true,
          style: {},
          qrConfig: {
            errorCorrection: 'M',
            foreground: '#000000',
            background: '#FFFFFF',
            padding: 1,
          },
        },
        {
          id: 'elem_buyer_1',
          type: 'buyerName',
          x: 14,
          y: 13,
          width: 24,
          height: 5,
          rotation: 0,
          opacity: 1,
          zIndex: 8,
          locked: false,
          visible: true,
          style: {
            fontFamily: 'Inter',
            fontSize: 10,
            fontWeight: '600',
            color: '#111111',
            alignment: 'left',
          },
        },
        {
          id: 'elem_solicitor_1',
          type: 'solicitorName',
          x: 17,
          y: 24,
          width: 21,
          height: 5,
          rotation: 0,
          opacity: 1,
          zIndex: 7,
          locked: false,
          visible: true,
          style: {
            fontFamily: 'Inter',
            fontSize: 10,
            fontWeight: '600',
            color: '#111111',
            alignment: 'left',
          },
        },
      ],
    });

    // 3. Initialize Default Print Layout
    printLayoutRepository.save(getDefaultPrintLayout(id));

    // 4. Log Activity
    settingsRepository.addActivity({
      type: 'raffle_created',
      title: `Created Raffle: ${newRaffle.raffleName}`,
      description: `Target draw on ${newRaffle.drawDate} with ticket price ₱${newRaffle.ticketAmount}.`,
      raffleId: id,
    });

    toast.success(`Raffle "${newRaffle.raffleName}" created!`);
    navigate(`/raffles/${id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back button & Header */}
      <div>
        <button
          onClick={() => navigate('/raffles')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Raffles</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#111111] tracking-tight">Create New Raffle</h2>
            <p className="text-xs text-[#6B7280]">
              Enter the campaign details. You will be able to customize the ticket design next.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            type="button"
            onClick={handleFillSample}
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#F97316]" />}
          >
            Fill Sample Data
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Raffle Name *"
            placeholder="e.g. Barangay Fiesta Grand Raffle 2026"
            value={raffleName}
            onChange={(e) => setRaffleName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Event Name *"
              placeholder="e.g. Barangay Fiesta 2026"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              required
            />
            <Input
              label="Ticket Name"
              placeholder="e.g. Grand Raffle Ticket"
              value={ticketName}
              onChange={(e) => setTicketName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Ticket Amount (₱) *"
              type="number"
              min={1}
              step={1}
              placeholder="100"
              value={ticketAmount}
              onChange={(e) => setTicketAmount(Number(e.target.value))}
              required
            />
            <Input
              label="Draw Date *"
              type="date"
              value={drawDate}
              onChange={(e) => setDrawDate(e.target.value)}
              required
            />
            <Input
              label="Draw Time"
              type="time"
              value={drawTime}
              onChange={(e) => setDrawTime(e.target.value)}
            />
          </div>

          <Input
            label="Venue"
            placeholder="e.g. Barangay Multi-Purpose Covered Court"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-1.5">
              Description & Prizes
            </label>
            <textarea
              rows={3}
              placeholder="List prizes, mechanics, and legal disclaimers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[#E5E5E5] bg-white px-3 py-2 text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>

          <Select
            label="Initial Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as RaffleStatus)}
          >
            <option value="active">Active (Ready for ticket generation)</option>
            <option value="draft">Draft</option>
          </Select>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
            <Button variant="outline" size="sm" type="button" onClick={() => navigate('/raffles')}>
              Cancel
            </Button>
            <Button variant="primary" size="md" type="submit">
              Save & Open Raffle
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
