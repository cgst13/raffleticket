import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { printSetsRepository } from '../services/storage/printSetsRepository';
import { designRepository } from '../services/storage/designRepository';
import { printLayoutRepository } from '../services/storage/printLayoutRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { ticketsRepository } from '../services/storage/ticketsRepository';
import { bookletsRepository } from '../services/storage/bookletsRepository';
import { printLayoutEngine, InterleavedPage } from '../services/printing/printLayoutEngine';
import { PrintSet } from '../types/printSet';
import { TicketDesign } from '../types/designer';
import { PrintLayout } from '../types/printLayout';
import { PrintTicketSheet } from '../components/printing/PrintTicketSheet';
import { PrintCalibrationModal } from '../components/printing/PrintCalibrationModal';
import { Button } from '../components/ui/Button';
import { useToast } from '../context/ToastContext';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Sliders,
  ArrowLeft,
  FileCheck,
} from 'lucide-react';

export const PrintPreviewPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [printSet, setPrintSet] = useState<PrintSet | null>(null);
  const [design, setDesign] = useState<TicketDesign | null>(null);
  const [layout, setLayout] = useState<PrintLayout | null>(null);
  const [pages, setPages] = useState<InterleavedPage[]>([]);

  // Preview Navigation & Zoom
  const [currentPageIndex, setCurrentPageIndex] = useState(0); // 0-based
  const [zoom, setZoom] = useState(0.75); // visual preview zoom multiplier
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);

  // Print Mode
  const [printMode, setPrintMode] = useState<'all' | 'single-page' | 'single-ticket'>('all');

  useEffect(() => {
    if (!setId) return;
    const set = printSetsRepository.getById(setId);
    if (!set) {
      navigate('/print-sets');
      return;
    }
    setPrintSet(set);

    const loadedDesign = designRepository.getByRaffleId(set.raffleId);
    setDesign(loadedDesign);

    const loadedLayout = printLayoutRepository.getByRaffleId(set.raffleId);
    setLayout(loadedLayout);

    if (loadedLayout) {
      const generatedPages = printLayoutEngine.generateInterleavedPages(set, loadedLayout);
      setPages(generatedPages);
    }
  }, [setId, navigate]);

  if (!printSet || !design || !layout) return null;

  const totalPages = pages.length;
  const currentPage = pages[currentPageIndex] || pages[0];

  const handlePrint = () => {
    // Mark status as printed
    printSetsRepository.update(printSet.id, { status: 'printed' });
    setPrintSet((prev) => (prev ? { ...prev, status: 'printed' } : null));
    toast.success('Print Set marked as Printed!');
    toast.info('Sending print job to browser...');
    window.print();
  };

  const handleSaveCalibration = (newCalibration: any) => {
    const updated = { ...layout, calibration: newCalibration };
    setLayout(updated);
    printLayoutRepository.save(updated);
    toast.success('Printer calibration saved!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col">
      {/* Top Controls Toolbar (Hidden during browser print) */}
      <div className="h-16 bg-neutral-950 border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between text-white shrink-0 no-print gap-3 overflow-x-auto select-none">
        {/* Left: Back & Set Details */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">
                Print Preview • Set #{String(printSet.setNumber).padStart(3, '0')}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                  printSet.status === 'printed'
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                    : 'bg-orange-900/60 text-orange-300 border border-orange-700'
                }`}
              >
                {printSet.status}
              </span>
            </div>
            <div className="text-xs text-neutral-400 font-mono">
              Tickets {printSet.startingTicketNumber} – {printSet.endingTicketNumber} ({printSet.totalTickets} tickets)
            </div>
          </div>
        </div>

        {/* Center: Pagination & Zoom */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Page Navigator */}
          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-lg p-0.5">
            <button
              onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
              disabled={currentPageIndex === 0}
              className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded hover:bg-neutral-800 transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-xs font-mono font-semibold text-neutral-200">
              Page {currentPageIndex + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPageIndex((p) => Math.min(totalPages - 1, p + 1))}
              disabled={currentPageIndex === totalPages - 1}
              className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded hover:bg-neutral-800 transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-neutral-900 border border-neutral-700 rounded-lg p-0.5">
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="px-2 text-xs font-mono text-neutral-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.min(1.5, z + 0.1))}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(0.75)}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
              title="Fit to Screen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Print Mode & Print Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsCalibrationOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 text-xs font-semibold text-neutral-300 hover:bg-neutral-800 transition-colors"
            title="Calibrate alignment"
          >
            <Sliders className="w-3.5 h-3.5 text-orange-400" />
            <span>Calibration</span>
          </button>

          {/* Print Scope Selector */}
          <select
            value={printMode}
            onChange={(e) => setPrintMode(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-900 text-xs text-white focus:outline-none"
          >
            <option value="all">Print All {totalPages} Pages</option>
            <option value="single-page">Print Current Page Only</option>
          </select>

          <Button
            variant="primary"
            size="md"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Now
          </Button>
        </div>
      </div>

      {/* Preview Viewport (Screen Display) */}
      <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-start no-print">
        {currentPage && (
          <div className="flex flex-col items-center">
            <PrintTicketSheet
              design={design}
              layout={layout}
              page={currentPage}
              totalPages={totalPages}
              scale={zoom}
              isPreview={true}
            />
            <div className="text-center text-xs text-neutral-400 mt-2 font-mono">
              Previewing Page {currentPage.pageNumber} of {totalPages} • Interleaved Booklets 1 to {printSet.totalBooklets}
            </div>
          </div>
        )}
      </div>

      {/* PRINT-ONLY DOM CONTAINER: Active only during window.print() */}
      <div className="hidden print:block print-only-container">
        {printMode === 'single-page' ? (
          // Print single active page
          <PrintTicketSheet
            design={design}
            layout={layout}
            page={currentPage}
            totalPages={totalPages}
            scale={1}
            isPreview={false}
          />
        ) : (
          // Print all interleaved pages
          pages.map((p) => (
            <PrintTicketSheet
              key={p.pageNumber}
              design={design}
              layout={layout}
              page={p}
              totalPages={totalPages}
              scale={1}
              isPreview={false}
            />
          ))
        )}
      </div>

      {/* Calibration Modal */}
      <PrintCalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        calibration={layout.calibration}
        onSave={handleSaveCalibration}
      />
    </div>
  );
};
