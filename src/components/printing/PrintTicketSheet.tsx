import React from 'react';
import { TicketDesign } from '../../types/designer';
import { PrintLayout } from '../../types/printLayout';
import { InterleavedPage } from '../../services/printing/printLayoutEngine';
import { printLayoutEngine } from '../../services/printing/printLayoutEngine';
import { SingleTicketRender } from './SingleTicketRender';

interface PrintTicketSheetProps {
  design: TicketDesign;
  layout: PrintLayout;
  page: InterleavedPage;
  totalPages: number;
  scale?: number;
  isPreview?: boolean;
}

export const PrintTicketSheet: React.FC<PrintTicketSheetProps> = ({
  design,
  layout,
  page,
  totalPages,
  scale = 1,
  isPreview = false,
}) => {
  const paperDims = printLayoutEngine.getPageDimensions(layout);
  const { margins, calibration } = layout;

  // Apply calibration offsets
  const appliedMarginLeft = Math.max(0, margins.left + (calibration?.offsetX || 0));
  const appliedMarginTop = Math.max(0, margins.top + (calibration?.offsetY || 0));

  return (
    <div
      className={`print-page relative bg-white box-border ${
        isPreview
          ? 'shadow-xl rounded-sm border border-neutral-300 mx-auto my-4 transition-transform'
          : 'm-0 p-0'
      }`}
      style={{
        width: `${paperDims.width * scale}mm`,
        height: `${paperDims.height * scale}mm`,
        paddingTop: `${appliedMarginTop * scale}mm`,
        paddingBottom: `${margins.bottom * scale}mm`,
        paddingLeft: `${appliedMarginLeft * scale}mm`,
        paddingRight: `${margins.right * scale}mm`,
      }}
    >
      {/* Optional Page Number & Info Header */}
      {layout.showPageNumbers && (
        <div
          className="absolute top-2 right-4 text-[9px] text-neutral-400 font-mono tracking-wider no-print"
          style={{ fontSize: `${8 * scale}pt` }}
        >
          Page {page.pageNumber} of {totalPages}
        </div>
      )}

      {/* Grid of Interleaved Tickets */}
      <div
        className="flex flex-wrap items-start content-start"
        style={{
          columnGap: `${(layout.horizontalGapMm + (calibration?.gapAdjustX || 0)) * scale}mm`,
          rowGap: `${(layout.verticalGapMm + (calibration?.gapAdjustY || 0)) * scale}mm`,
        }}
      >
        {page.slots.map((slot, idx) => {
          const effectiveGapY = (layout.verticalGapMm || 0) + (calibration?.gapAdjustY || 0);
          const hasScissorCutLine = effectiveGapY >= 1;
          const ticketsPerRow = layout.ticketsPerRow || 1;
          const isNotFirstRow = idx >= ticketsPerRow;

          return (
            <div key={idx} className="relative group">
              {/* Cut Scissor Line when spacing gap is 1mm and above */}
              {hasScissorCutLine && isNotFirstRow && (
                <div
                  className="absolute left-0 right-0 flex items-center justify-between pointer-events-none select-none z-20"
                  style={{
                    top: `-${(effectiveGapY / 2) * scale}mm`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  <div className="flex items-center gap-1.5 w-full px-1">
                    <span
                      style={{ fontSize: `${Math.max(6, 8 * scale)}pt` }}
                      className="text-neutral-500 font-serif leading-none shrink-0"
                      title="Cut Line"
                    >
                      ✂
                    </span>
                    <div className="w-full border-t border-dashed border-neutral-400" />
                    <span
                      style={{ fontSize: `${Math.max(6, 8 * scale)}pt` }}
                      className="text-neutral-500 font-serif leading-none shrink-0 rotate-180"
                      title="Cut Line"
                    >
                      ✂
                    </span>
                  </div>
                </div>
              )}

              {/* Ticket Container with Border / Crop Marks */}
              <div
                className={`relative ${
                  layout.showTicketBorders ? 'border border-neutral-300/80' : ''
                }`}
              >
                {/* Optional Corner Crop Marks */}
                {layout.showCropMarks && (
                  <>
                    <div className="absolute -top-2 -left-2 w-2 h-2 border-r border-b border-black/40 pointer-events-none" />
                    <div className="absolute -top-2 -right-2 w-2 h-2 border-l border-b border-black/40 pointer-events-none" />
                    <div className="absolute -bottom-2 -left-2 w-2 h-2 border-r border-t border-black/40 pointer-events-none" />
                    <div className="absolute -bottom-2 -right-2 w-2 h-2 border-l border-t border-black/40 pointer-events-none" />
                  </>
                )}

                <SingleTicketRender
                  design={design}
                  ticket={slot.ticket}
                  booklet={slot.booklet}
                  resolvedSolicitor={slot.resolvedSolicitor}
                  resolvedBuyer={slot.resolvedBuyer}
                  scale={scale}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
