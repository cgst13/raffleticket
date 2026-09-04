import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { designRepository } from '../services/storage/designRepository';
import { printLayoutRepository } from '../services/storage/printLayoutRepository';
import { printSetsRepository } from '../services/storage/printSetsRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { ticketGenerator } from '../services/tickets/ticketGenerator';
import { printLayoutEngine } from '../services/printing/printLayoutEngine';
import { ticketFormatter } from '../services/tickets/ticketFormatter';
import { Raffle } from '../types/raffle';
import { TicketDesign } from '../types/designer';
import { PaperSize, PageOrientation, PAPER_DIMENSIONS_MM } from '../types/printLayout';
import { PrintSet } from '../types/printSet';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { SingleTicketRender } from '../components/printing/SingleTicketRender';
import { PrintSetTable } from '../components/sets/PrintSetTable';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import {
  Sparkles,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Printer,
  Eye,
  Maximize2,
  Minimize2,
  Layers,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

export const GenerateTicketsPage: React.FC = () => {
  const { raffleId } = useParams<{ raffleId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [design, setDesign] = useState<TicketDesign | null>(null);

  // Form Inputs
  const [startingNumber, setStartingNumber] = useState('000001');
  const [prefix, setPrefix] = useState('');
  const [ticketsPerBooklet, setTicketsPerBooklet] = useState<number>(10); // T
  const [numberOfBooklets, setNumberOfBooklets] = useState<number>(5); // B

  // Paper and auto-fit layout settings (Default: Folio 8.5 x 13 in, Portrait)
  const [paperSize, setPaperSize] = useState<PaperSize>('Folio');
  const [orientation, setOrientation] = useState<PageOrientation>('portrait');
  const [marginMm, setMarginMm] = useState<number>(5); // 5mm margin on all sides
  const [spacingMm, setSpacingMm] = useState<number>(3); // Gap/spacing between tickets in mm (Default: 3mm)

  // Preview controls
  const [previewPageIdx, setPreviewPageIdx] = useState<number>(0);
  const [previewZoom, setPreviewZoom] = useState<number>(0.55);

  // Generation status
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<number | null>(null);
  const [lastGeneratedSet, setLastGeneratedSet] = useState<PrintSet | null>(null);
  const [setsList, setSetsList] = useState<PrintSet[]>([]);
  const [showParameters, setShowParameters] = useState(false);
  const [deleteSetId, setDeleteSetId] = useState<string | null>(null);

  const loadData = () => {
    if (!raffleId) return;
    const r = rafflesRepository.getById(raffleId);
    if (!r) {
      navigate('/raffles');
      return;
    }
    setRaffle(r);

    // Load or create design
    let loadedDesign = designRepository.getByRaffleId(raffleId);
    if (!loadedDesign) {
      loadedDesign = {
        id: `design_${raffleId}`,
        raffleId,
        name: `${r.raffleName} Template`,
        widthMm: 205.9,
        heightMm: 64,
        backgroundColor: '#FFFDF9',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        elements: [
          {
            id: 'elem_title',
            type: 'text',
            x: 60,
            y: 4,
            width: 150,
            height: 8,
            zIndex: 5,
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
            content: r.raffleName,
            style: {
              fontFamily: 'Inter',
              fontSize: 12,
              fontWeight: '800',
              color: '#111111',
              alignment: 'left',
            },
          },
          {
            id: 'elem_event',
            type: 'text',
            x: 60,
            y: 13,
            width: 150,
            height: 6,
            zIndex: 4,
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
            content: `Event: ${r.eventName}`,
            style: {
              fontFamily: 'Inter',
              fontSize: 9,
              fontWeight: '600',
              color: '#4B5563',
              alignment: 'left',
            },
          },
          {
            id: 'elem_price',
            type: 'text',
            x: 60,
            y: 20,
            width: 100,
            height: 6,
            zIndex: 5,
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
            content: `Price: ${ticketFormatter.formatCurrency(r.ticketAmount)}`,
            style: {
              fontFamily: 'Inter',
              fontSize: 9,
              fontWeight: '700',
              color: '#ea580c',
              alignment: 'left',
            },
          },
          {
            id: 'elem_num_main',
            type: 'ticketNumber',
            x: 145,
            y: 6,
            width: 55,
            height: 8,
            zIndex: 9,
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
            style: {
              fontFamily: 'JetBrains Mono',
              fontSize: 14,
              fontWeight: '800',
              color: '#c2410c',
              alignment: 'right',
            },
            numberFormat: { padding: 6, sampleValue: '000001' },
          },
          {
            id: 'elem_qr',
            type: 'qrCode',
            x: 165,
            y: 15,
            width: 20,
            height: 20,
            zIndex: 11,
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
            style: {},
          },
          {
            id: 'elem_stub_title',
            type: 'text',
            x: 4,
            y: 4,
            width: 48,
            height: 5,
            zIndex: 5,
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
            content: 'STUB',
            style: {
              fontFamily: 'Inter',
              fontSize: 8,
              fontWeight: '800',
              color: '#9CA3AF',
              alignment: 'left',
            },
          },
          {
            id: 'elem_stub_num',
            type: 'ticketNumber',
            x: 4,
            y: 10,
            width: 48,
            height: 6,
            zIndex: 9,
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
            style: {
              fontFamily: 'JetBrains Mono',
              fontSize: 10,
              fontWeight: '700',
              color: '#c2410c',
              alignment: 'left',
            },
            numberFormat: { padding: 6, sampleValue: '000001' },
          },
          {
            id: 'elem_buyer',
            type: 'buyerName',
            x: 4,
            y: 18,
            width: 48,
            height: 5,
            zIndex: 6,
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
            content: 'Name: _________________',
            style: {
              fontFamily: 'Inter',
              fontSize: 7,
              fontWeight: '500',
              color: '#6B7280',
              alignment: 'left',
            },
          },
          {
            id: 'elem_contact',
            type: 'text',
            x: 4,
            y: 24,
            width: 48,
            height: 5,
            zIndex: 6,
            opacity: 1,
            rotation: 0,
            locked: false,
            visible: true,
            content: 'Contact: ______________',
            style: {
              fontFamily: 'Inter',
              fontSize: 7,
              fontWeight: '500',
              color: '#6B7280',
              alignment: 'left',
            },
          },
        ],
      };
      designRepository.save(loadedDesign);
    }
    setDesign(loadedDesign);

    // Load print sets for this raffle
    const existingSets = printSetsRepository.getAll({ raffleId });
    setSetsList(existingSets);

    if (existingSets.length > 0) {
      const latest = existingSets[0];
      setLastGeneratedSet(latest);
      setTicketsPerBooklet(latest.ticketsPerBooklet);
      setNumberOfBooklets(latest.totalBooklets);
      const layout = printLayoutRepository.getByRaffleId(raffleId);
      if (layout) {
        setPaperSize(layout.paperSize);
        setOrientation(layout.orientation);
        setMarginMm(layout.margins.top);
        setSpacingMm(layout.verticalGapMm);
      }
    }

    // Auto calculate next sequential available number
    const nextInfo = ticketGenerator.getNextStartingSequence(raffleId, 4);
    setStartingNumber(nextInfo.nextFormatted);
  };

  const handlePrintSet = (targetSet: PrintSet) => {
    printSetsRepository.update(targetSet.id, { status: 'printed' });
    if (raffleId) setSetsList(printSetsRepository.getAll({ raffleId }));
    if (lastGeneratedSet && lastGeneratedSet.id === targetSet.id) {
      setLastGeneratedSet({ ...lastGeneratedSet, status: 'printed' });
    }
    toast.success(`Print Set #${String(targetSet.setNumber).padStart(3, '0')} marked as Printed! Opening preview...`);
    navigate(`/print-sets/${targetSet.id}/preview`);
  };

  const handleTogglePrinted = (targetSet: PrintSet, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = targetSet.status === 'printed' ? 'generated' : 'printed';
    printSetsRepository.update(targetSet.id, { status: newStatus });
    if (raffleId) setSetsList(printSetsRepository.getAll({ raffleId }));
    if (lastGeneratedSet && lastGeneratedSet.id === targetSet.id) {
      setLastGeneratedSet({ ...lastGeneratedSet, status: newStatus });
    }
    toast.success(`Print Set #${String(targetSet.setNumber).padStart(3, '0')} status updated to ${newStatus}.`);
  };

  const handleConfirmDeleteSet = () => {
    if (!deleteSetId || !raffleId) return;
    printSetsRepository.delete(deleteSetId);
    ticketsRepository.deleteByPrintSetId(deleteSetId);
    bookletsRepository.deleteByPrintSetId(deleteSetId);
    toast.success('Print Set and all its associated tickets deleted.');
    setDeleteSetId(null);

    // Refresh sets and update next sequence
    const updatedSets = printSetsRepository.getAll({ raffleId });
    setSetsList(updatedSets);
    if (updatedSets.length > 0) {
      setLastGeneratedSet(updatedSets[0]);
    } else {
      setLastGeneratedSet(null);
      setShowParameters(true);
    }
    const nextInfo = ticketGenerator.getNextStartingSequence(raffleId, 4);
    setStartingNumber(nextInfo.nextFormatted);
  };

  useEffect(() => {
    loadData();
  }, [raffleId]);

  // Paper Dimensions
  const paperDims = useMemo(() => {
    const std = PAPER_DIMENSIONS_MM[paperSize === 'Custom' ? 'Folio' : paperSize];
    return std ? std[orientation] : { width: 215.9, height: 330.2 };
  }, [paperSize, orientation]);

  // Real-time calculations
  const startSeq = ticketFormatter.parseSequence(startingNumber);
  const T = Math.max(1, Number(ticketsPerBooklet) || 1);
  const B = Math.max(1, Number(numberOfBooklets) || 1);
  const totalTickets = T * B;
  const totalPages = T;
  const endSeq = startSeq + totalTickets - 1;

  // Auto-fit ticket dimensions based on paper size, Number of Booklets (B = rows per paper), and ticket spacing
  const totalSpacingMm = (B - 1) * spacingMm;
  const printableWidth = Math.max(50, paperDims.width - marginMm * 2);
  const printableHeight = Math.max(25, paperDims.height - marginMm * 2 - totalSpacingMm);
  const autoTicketWidth = Math.round(printableWidth * 10) / 10;
  const autoTicketHeight = Math.round((printableHeight / B) * 10) / 10;

  // Real-time design synchronized with auto-fitted dimensions
  const liveDesign = useMemo<TicketDesign | null>(() => {
    if (!design) return null;
    return {
      ...design,
      widthMm: autoTicketWidth,
      heightMm: autoTicketHeight,
    };
  }, [design, autoTicketWidth, autoTicketHeight]);

  // Collision Check
  const collisionCheck =
    startSeq > 0 && totalTickets > 0 && raffle
      ? ticketGenerator.checkCollision(raffle.id, startSeq, totalTickets)
      : { hasCollision: false, conflictingNumbers: [] };

  const hasSets = setsList.length > 0;
  const nextSetNum = raffle ? printSetsRepository.getNextSetNumber(raffle.id) : 1;
  const nextFormattedEnd = ticketFormatter.formatTicketNumber(startSeq + totalTickets - 1, {
    prefix,
    padding: ticketFormatter.detectPadding(startingNumber),
  });

  // Generate Set Function
  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!raffle) return;

    if (startSeq <= 0 || T <= 0 || B <= 0) {
      toast.error('Please enter valid numeric parameters.');
      return;
    }

    if (collisionCheck.hasCollision) {
      toast.error('Cannot generate: Ticket numbers overlap with existing tickets.');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(25);

    // Save auto-fitted design and print layout
    if (liveDesign) {
      designRepository.save(liveDesign);
    }
    const layout = printLayoutRepository.getByRaffleId(raffle.id);
    if (layout) {
      printLayoutRepository.save({
        ...layout,
        paperSize,
        orientation,
        margins: { top: marginMm, bottom: marginMm, left: marginMm, right: marginMm },
        ticketWidthMm: autoTicketWidth,
        ticketHeightMm: autoTicketHeight,
        ticketsPerRow: 1,
        rowsPerPage: B,
        verticalGapMm: spacingMm,
        horizontalGapMm: 0,
        showBookletNumber: false,
      });
    }

    // Smooth generation progress
    setTimeout(() => {
      setGenerationProgress(70);
      setTimeout(() => {
        const result = ticketGenerator.generatePrintSet({
          raffleId: raffle.id,
          startingTicketNumber: startingNumber,
          ticketsPerBooklet: T,
          bookletsPerRow: 1,
          numberOfBooklets: B,
          formatOptions: { prefix, padding: ticketFormatter.detectPadding(startingNumber) },
        });

        setIsGenerating(false);
        setGenerationProgress(null);

        if (result.success && result.printSet) {
          setLastGeneratedSet(result.printSet);
          setSetsList(printSetsRepository.getAll({ raffleId: raffle.id }));
          toast.success(
            `Generated Set #${result.printSet.setNumber} (${result.printSet.startingTicketNumber}–${result.printSet.endingTicketNumber}) with ${result.totalTickets} tickets!`
          );

          // Auto-advance starting number to next consecutive sequence for next set!
          const nextSeq = result.printSet.endingSequence + 1;
          const nextFormatted = ticketFormatter.formatTicketNumber(nextSeq, {
            padding: ticketFormatter.detectPadding(startingNumber),
          });
          setStartingNumber(nextFormatted);
        } else {
          toast.error(result.error || 'Failed to generate tickets.');
        }
      }, 300);
    }, 200);
  };

  if (!raffle || !liveDesign) return null;

  return (
    <div className="space-y-6">
      {/* ── Top Header & Navigation ────────────────── */}
      <div>
        <button
          onClick={() => navigate(`/raffles/${raffle.id}`)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {raffle.raffleName}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight flex items-center gap-2">
              Generate Ticket Print Sets
              <span className="text-xs font-bold px-2 py-0.5 bg-orange-100 text-[#ea580c] rounded-full">
                Auto-Fitted Layout
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-[#6B7280]">
              Ticket sizes automatically adapt to fit {B} rows on {paperSize} paper with zero overflow.
            </p>
          </div>

          {lastGeneratedSet && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePrintSet(lastGeneratedSet)}
              leftIcon={<Printer className="w-4 h-4 text-[#F97316]" />}
            >
              Print Set #{lastGeneratedSet.setNumber}
            </Button>
          )}
        </div>
      </div>

      {/* ── FAST CONTINUOUS GENERATION DASHBOARD (Shown when sets already exist) ─── */}
      {hasSets && !showParameters ? (
        <Card className="p-6 bg-white border border-neutral-200 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  Format Established • Ready for Set #{nextSetNum}
                </h2>
                <Badge status="active">Locked Format</Badge>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Subsequent sets automatically inherit the format and auto-fitted ticket sizing from Set #1. Click below to generate Set #{nextSetNum}.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowParameters(true)}
              className="text-xs self-start md:self-auto"
            >
              Modify Format Parameters
            </Button>
          </div>

          {/* Locked Parameters Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Next Sequence</span>
              <span className="font-mono font-black text-[#c2410c] text-sm">
                {startingNumber} – {nextFormattedEnd}
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Paper & Orientation</span>
              <span className="font-bold text-neutral-800 capitalize">
                {paperSize} • {orientation}
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Booklets / Sheet</span>
              <span className="font-bold text-neutral-800">
                {B} booklets ({B} rows)
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Tickets / Booklet</span>
              <span className="font-bold text-neutral-800">
                {T} tickets ({T} sheets)
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Ticket Size</span>
              <span className="font-bold text-neutral-800 font-mono">
                {autoTicketWidth} × {autoTicketHeight} mm
              </span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-0.5">Spacing / Margin</span>
              <span className="font-bold text-neutral-800 font-mono">
                {spacingMm}mm / {marginMm}mm
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={() => handleGenerate()}
              isLoading={isGenerating}
              className="flex-1 sm:flex-none font-black text-sm px-6 py-3 bg-emerald-600 hover:bg-emerald-700 border-emerald-700 shadow-sm"
              leftIcon={<Sparkles className="w-5 h-5" />}
            >
              ⚡ Generate Set #{nextSetNum} ({startingNumber} – {nextFormattedEnd})
            </Button>
            {lastGeneratedSet && (
              <Button
                variant="secondary"
                size="lg"
                onClick={() => handlePrintSet(lastGeneratedSet)}
                className="font-bold text-sm px-5"
                leftIcon={<Printer className="w-5 h-5" />}
              >
                Print Set #{lastGeneratedSet.setNumber}
              </Button>
            )}
          </div>
        </Card>
      ) : (
        /* ── INITIAL OR EXPANDED TWO-COLUMN CONFIGURATION ──────────────────── */
        <div className="space-y-4">
          {hasSets && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowParameters(false)}
                className="text-xs"
              >
                ← Hide Format Parameters
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Configuration Form (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="p-5">
                <CardHeader className="pb-3 mb-3 border-b border-[#E5E5E5]">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-[#F97316]" />
                    <span>Ticket Generation Parameters</span>
                  </CardTitle>
                </CardHeader>

                <form onSubmit={handleGenerate} className="space-y-4 text-xs">
                  {/* Row 1: Starting Number & Prefix */}
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Starting Number *"
                      placeholder="000001"
                      value={startingNumber}
                      onChange={(e) => setStartingNumber(e.target.value)}
                      helperText="Preserves sequence & zeros"
                      required
                    />
                    <Input
                      label="Prefix (Optional)"
                      placeholder="e.g. R- or 2026-"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      helperText="Prepended to all numbers"
                    />
                  </div>

                  {/* Row 2: Tickets per Booklet (T) & Number of Booklets (B) */}
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Tickets per Booklet (T) *"
                      type="number"
                      min={1}
                      value={ticketsPerBooklet}
                      onChange={(e) => setTicketsPerBooklet(Math.max(1, Number(e.target.value)))}
                      helperText="Sheets per booklet (e.g. 10)"
                      required
                    />
                    <Input
                      label="Number of Booklets (B) *"
                      type="number"
                      min={1}
                      max={20}
                      value={numberOfBooklets}
                      onChange={(e) => setNumberOfBooklets(Math.max(1, Number(e.target.value)))}
                      helperText="Rows printed per sheet"
                      required
                    />
                  </div>

                  {/* Row 3: Paper Size & Orientation */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E5E5]">
                    <Select
                      label="Paper Size"
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                    >
                      <option value="Folio">Folio (8.5 × 13 in / 216 × 330 mm) — Default</option>
                      <option value="A4">A4 (210 × 297 mm)</option>
                      <option value="Letter">Letter (8.5 × 11 in / 216 × 279 mm)</option>
                      <option value="Legal">Legal (8.5 × 14 in / 216 × 356 mm)</option>
                    </Select>

                    <Select
                      label="Paper Orientation"
                      value={orientation}
                      onChange={(e) => setOrientation(e.target.value as PageOrientation)}
                    >
                      <option value="portrait">Portrait (Default)</option>
                      <option value="landscape">Landscape</option>
                    </Select>
                  </div>

                  {/* Row 4: Ticket Spacing (Gap) & Margin */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#E5E5E5]">
                    <Input
                      label="Ticket Spacing / Gap (mm)"
                      type="number"
                      min={0}
                      max={25}
                      step={0.5}
                      value={spacingMm}
                      onChange={(e) => setSpacingMm(Math.max(0, Number(e.target.value)))}
                      helperText="Gap between tickets (0 = flush cut lines)"
                    />
                    <Input
                      label="Page Margin (mm)"
                      type="number"
                      min={0}
                      max={40}
                      step={1}
                      value={marginMm}
                      onChange={(e) => setMarginMm(Math.max(0, Number(e.target.value)))}
                      helperText="Outer sheet border on all sides"
                    />
                  </div>

                  {/* Auto-Fit Calculation Badge & Metrics */}
                  <div className="p-3.5 bg-gradient-to-br from-orange-50/40 to-neutral-50 rounded-xl border border-orange-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#ea580c] flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5" />
                        Auto-Fitted Sizing
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                        100% Page Fit
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      <div className="p-2 bg-white rounded-lg border border-neutral-200">
                        <span className="text-neutral-400 block text-[10px]">Autofitted Ticket Size:</span>
                        <strong className="text-neutral-900 font-mono text-xs">
                          {autoTicketWidth} × {autoTicketHeight} mm
                        </strong>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-neutral-200">
                        <span className="text-neutral-400 block text-[10px]">Tickets / Sheet:</span>
                        <strong className="text-neutral-900 font-mono text-xs">
                          {B} rows ({B} booklets)
                        </strong>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 pt-1 border-t border-orange-100">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Calculated Total Tickets:</span>
                        <span className="font-mono font-bold text-neutral-900">
                          {T} × {B} = {totalTickets} pcs
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Number Sequence:</span>
                        <span className="font-mono font-bold text-[#c2410c]">
                          {startingNumber} – {ticketFormatter.formatTicketNumber(endSeq, { prefix, padding: ticketFormatter.detectPadding(startingNumber) })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Physical Sheets to Print:</span>
                        <span className="font-bold text-neutral-800">{totalPages} sheets</span>
                      </div>
                    </div>
                  </div>

                  {/* Collision Warning */}
                  {collisionCheck.hasCollision && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Ticket Number Collision!</strong>
                        <p className="text-[11px] text-red-600 mt-0.5">
                          Numbers already exist for this raffle: {collisionCheck.conflictingNumbers.slice(0, 3).join(', ')}...
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Generation Progress Bar */}
                  {isGenerating && generationProgress !== null && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-neutral-500">
                        <span>Generating tickets & barcodes...</span>
                        <span>{generationProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-300"
                          style={{ width: `${generationProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isGenerating}
                    disabled={collisionCheck.hasCollision}
                    className="w-full font-bold shadow-md shadow-orange-500/10"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                  >
                    {hasSets ? `Generate Set #${nextSetNum}` : 'Generate Set #1'}
                  </Button>
                </form>
              </Card>
            </div>

            {/* RIGHT COLUMN: Live Paper Print Preview (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <Card className="p-5 bg-white border border-[#E5E5E5] flex flex-col justify-between">
                <CardHeader className="pb-3 mb-3 border-b border-[#E5E5E5] flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="w-4 h-4 text-[#F97316]" />
                      <span>Live Paper Print Preview (Autofitted on {paperSize})</span>
                    </CardTitle>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Showing physical Sheet {previewPageIdx + 1} of {T} ({B} rows stacked vertically)
                    </p>
                  </div>

                  {/* Page Navigation for preview */}
                  {T > 1 && (
                    <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
                      <button
                        onClick={() => setPreviewPageIdx((p) => Math.max(0, p - 1))}
                        disabled={previewPageIdx === 0}
                        className="px-2 py-0.5 text-xs font-bold text-neutral-600 disabled:opacity-30 rounded hover:bg-white transition-all"
                      >
                        Prev
                      </button>
                      <span className="text-[11px] font-mono px-1 font-semibold text-neutral-700">
                        {previewPageIdx + 1}/{T}
                      </span>
                      <button
                        onClick={() => setPreviewPageIdx((p) => Math.min(T - 1, p + 1))}
                        disabled={previewPageIdx === T - 1}
                        className="px-2 py-0.5 text-xs font-bold text-neutral-600 disabled:opacity-30 rounded hover:bg-white transition-all"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </CardHeader>

                {/* Paper Sheet Viewport with Zoom Scale */}
                <div className="p-4 bg-neutral-100 rounded-xl flex flex-col items-center justify-center overflow-auto border border-neutral-200 min-h-[420px]">
                  {/* Scaled Physical Sheet Canvas */}
                  <div
                    className="bg-white shadow-2xl rounded-sm border border-neutral-300 relative box-border transition-all"
                    style={{
                      width: `${paperDims.width * previewZoom}mm`,
                      height: `${paperDims.height * previewZoom}mm`,
                      padding: `${marginMm * previewZoom}mm`,
                    }}
                  >
                    {/* Paper Margins & Ticket Slots Container */}
                    <div
                      className="w-full h-full flex flex-col justify-start"
                      style={{
                        gap: `${spacingMm * previewZoom}mm`,
                      }}
                    >
                      {Array.from({ length: B }, (_, b) => {
                        const ticketSeq = printLayoutEngine.calculateSequence(
                          startSeq,
                          T,
                          b,
                          previewPageIdx
                        );
                        const formattedNum = ticketFormatter.formatTicketNumber(ticketSeq, {
                          prefix,
                          padding: ticketFormatter.detectPadding(startingNumber),
                        });

                        // Dummy ticket for rendering
                        const sampleTicket: any = {
                          id: `sample_ticket_${b}`,
                          ticketNumber: formattedNum,
                          ticketSequence: ticketSeq,
                          qrValue: `TKT:${raffle.id}:${formattedNum}`,
                        };

                        const sampleBooklet: any = {
                          bookletNumber: b + 1,
                        };

                        return (
                          <div
                            key={b}
                            className={`relative border-dashed border-neutral-300 group ${
                              spacingMm > 0 ? 'border' : 'border-b last:border-b-0'
                            }`}
                            style={{
                              width: `${autoTicketWidth * previewZoom}mm`,
                              height: `${autoTicketHeight * previewZoom}mm`,
                            }}
                          >
                            {/* Scissor Cut Line when spacing gap is 1mm and above */}
                            {spacingMm >= 1 && b > 0 && (
                              <div
                                className="absolute left-0 right-0 flex items-center justify-between pointer-events-none select-none z-20"
                                style={{
                                  top: `-${(spacingMm / 2) * previewZoom}mm`,
                                  transform: 'translateY(-50%)',
                                }}
                              >
                                <div className="flex items-center gap-1 w-full px-1">
                                  <span
                                    style={{ fontSize: `${Math.max(5, 7 * previewZoom)}pt` }}
                                    className="text-neutral-500 font-serif leading-none shrink-0"
                                    title="Cut Line"
                                  >
                                    ✂
                                  </span>
                                  <div className="w-full border-t border-dashed border-neutral-400" />
                                  <span
                                    style={{ fontSize: `${Math.max(5, 7 * previewZoom)}pt` }}
                                    className="text-neutral-500 font-serif leading-none shrink-0 rotate-180"
                                    title="Cut Line"
                                  >
                                    ✂
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Ticket Render */}
                            <SingleTicketRender
                              design={liveDesign}
                              ticket={sampleTicket}
                              booklet={sampleBooklet}
                              scale={previewZoom}
                              className="w-full h-full"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Preview Sheet Footer Details */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-neutral-500 pt-3 gap-2 border-t border-[#E5E5E5] mt-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>
                      <strong>Cut & Stack Ready:</strong> After printing {T} sheets, cut the {B - 1} horizontal lines to instantly produce {B} sorted booklets.
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span>Zoom:</span>
                    {[0.4, 0.55, 0.7].map((z) => (
                      <button
                        key={z}
                        onClick={() => setPreviewZoom(z)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          previewZoom === z ? 'bg-neutral-800 text-white' : 'bg-neutral-100 hover:bg-neutral-200'
                        }`}
                      >
                        {Math.round(z * 100)}%
                      </button>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── Generated Print Sets in this Event ───────── */}
      <Card className="p-5">
        <CardHeader className="pb-3 mb-3 border-b border-[#E5E5E5] flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#F97316]" />
            <span>Generated Print Sets for {raffle.raffleName} ({setsList.length})</span>
          </CardTitle>
          <span className="text-xs text-neutral-500">
            Click Print on any set to open print preview and automatically update its status to Printed.
          </span>
        </CardHeader>

        {setsList.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs">
            No print sets generated yet. Configure the parameters above and click "Generate Set #1" to begin.
          </div>
        ) : (
          <div className="pt-2">
            <PrintSetTable
              printSets={setsList}
              onPrint={handlePrintSet}
              onTogglePrinted={handleTogglePrinted}
              onDelete={(id) => setDeleteSetId(id)}
            />
          </div>
        )}
      </Card>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!deleteSetId}
        onClose={() => setDeleteSetId(null)}
        onConfirm={handleConfirmDeleteSet}
        title="Delete Generated Print Set?"
        message="This will delete this print set and all tickets and booklets generated in this batch. Any subsequent print sets can then be generated without sequence collisions."
        confirmLabel="Delete Set"
        variant="danger"
      />
    </div>
  );
};


