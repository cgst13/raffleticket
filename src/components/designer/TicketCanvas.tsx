import React, { useRef, useState, useEffect } from 'react';
import { DesignElement, TicketDesign } from '../../types/designer';
import { qrService } from '../../services/qr/qrService';
import { Lock, RotateCw } from 'lucide-react';

interface TicketCanvasProps {
  design: TicketDesign;
  selectedId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  zoom: number;
  showGrid: boolean;
  snapToGrid: boolean;
}

// 1 mm is approximately 3.78 pixels at 96 DPI
const MM_TO_PX = 3.78;
const GRID_SNAP_MM = 2; // 2mm snap grid

export const TicketCanvas: React.FC<TicketCanvasProps> = ({
  design,
  selectedId,
  onSelectElement,
  onUpdateElement,
  zoom,
  showGrid,
  snapToGrid,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [qrPreviews, setQrPreviews] = useState<Record<string, string>>({});

  // Dragging / Resizing State
  const [dragState, setDragState] = useState<{
    elementId: string;
    isResizing: boolean;
    resizeHandle?: 'se' | 'sw' | 'ne' | 'nw';
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  // Generate QR previews whenever qrCode elements change
  useEffect(() => {
    design.elements.forEach(async (el) => {
      if (el.type === 'qrCode') {
        const samplePayload = `raffle://ticket/sample-ticket-preview`;
        const dataUrl = await qrService.toDataURL(samplePayload, {
          errorCorrectionLevel: el.qrConfig?.errorCorrection || 'M',
          color: {
            dark: el.qrConfig?.foreground || '#000000',
            light: el.qrConfig?.background || '#FFFFFF00',
          },
        });
        setQrPreviews((prev) => ({ ...prev, [el.id]: dataUrl }));
      }
    });
  }, [design.elements]);

  // Global mousemove and mouseup listeners for smooth dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;

      const deltaXmm = (e.clientX - dragState.startX) / (MM_TO_PX * zoom);
      const deltaYmm = (e.clientY - dragState.startY) / (MM_TO_PX * zoom);

      if (dragState.isResizing) {
        let newW = Math.max(5, dragState.initialW + deltaXmm);
        let newH = Math.max(5, dragState.initialH + deltaYmm);

        if (snapToGrid) {
          newW = Math.round(newW / GRID_SNAP_MM) * GRID_SNAP_MM;
          newH = Math.round(newH / GRID_SNAP_MM) * GRID_SNAP_MM;
        }

        onUpdateElement(dragState.elementId, { width: newW, height: newH });
      } else {
        let newX = Math.max(0, Math.min(design.widthMm - 5, dragState.initialX + deltaXmm));
        let newY = Math.max(0, Math.min(design.heightMm - 5, dragState.initialY + deltaYmm));

        if (snapToGrid) {
          newX = Math.round(newX / GRID_SNAP_MM) * GRID_SNAP_MM;
          newY = Math.round(newY / GRID_SNAP_MM) * GRID_SNAP_MM;
        }

        onUpdateElement(dragState.elementId, { x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        setDragState(null);
      }
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom, snapToGrid, design.widthMm, design.heightMm, onUpdateElement]);

  const handleElementMouseDown = (e: React.MouseEvent, el: DesignElement) => {
    // Only respond to left mouse button (0)
    if (e.button !== 0) return;

    e.stopPropagation();
    onSelectElement(el.id);

    if (el.locked) return;

    setDragState({
      elementId: el.id,
      isResizing: false,
      startX: e.clientX,
      startY: e.clientY,
      initialX: el.x,
      initialY: el.y,
      initialW: el.width,
      initialH: el.height,
    });
  };

  const handleResizeHandleMouseDown = (e: React.MouseEvent, el: DesignElement, handle: 'se') => {
    if (e.button !== 0) return;
    e.stopPropagation();
    setDragState({
      elementId: el.id,
      isResizing: true,
      resizeHandle: handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: el.x,
      initialY: el.y,
      initialW: el.width,
      initialH: el.height,
    });
  };

  const canvasPxWidth = design.widthMm * MM_TO_PX * zoom;
  const canvasPxHeight = design.heightMm * MM_TO_PX * zoom;

  return (
    <div
      className="flex-1 bg-neutral-100 overflow-auto flex items-center justify-center p-8 relative select-none"
      onClick={() => onSelectElement(null)}
    >
      {/* Canvas Frame */}
      <div
        ref={canvasRef}
        className="relative bg-white shadow-2xl transition-all duration-75 overflow-hidden border border-neutral-300 rounded-sm"
        style={{
          width: `${canvasPxWidth}px`,
          height: `${canvasPxHeight}px`,
          backgroundColor: design.backgroundColor || '#FFFFFF',
        }}
      >
        {/* Optional Grid Pattern */}
        {showGrid && (
          <div
            className="absolute inset-0 pointer-events-none z-0 opacity-40 canvas-grid-pattern"
            style={{
              backgroundSize: `${GRID_SNAP_MM * MM_TO_PX * zoom}px ${GRID_SNAP_MM * MM_TO_PX * zoom}px`,
            }}
          />
        )}

        {/* Background Image */}
        {design.backgroundImageUrl && (
          <img
            src={design.backgroundImageUrl}
            alt="Ticket Background"
            className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
          />
        )}

        {/* Render Elements */}
        {design.elements
          .filter((el) => el.visible)
          .sort((a, b) => a.zIndex - b.zIndex)
          .map((el) => {
            const isSelected = el.id === selectedId;
            const elPxX = el.x * MM_TO_PX * zoom;
            const elPxY = el.y * MM_TO_PX * zoom;
            const elPxW = el.width * MM_TO_PX * zoom;
            const elPxH = el.height * MM_TO_PX * zoom;

            // Resolved sample content
            let renderedContent: React.ReactNode = null;

            if (el.type === 'ticketNumber') {
              const prefix = el.numberFormat?.prefix || '';
              const suffix = el.numberFormat?.suffix || '';
              const padding = el.numberFormat?.padding || 4;
              const sampleNum = String(1).padStart(padding, '0');
              renderedContent = `${prefix}${sampleNum}${suffix}`;
            } else if (el.type === 'qrCode') {
              const qrSrc = qrPreviews[el.id];
              renderedContent = qrSrc ? (
                <img src={qrSrc} alt="QR Code" className="w-full h-full object-contain pointer-events-none" />
              ) : (
                <div className="w-full h-full bg-neutral-100 flex items-center justify-center text-[8px] text-neutral-400">
                  QR
                </div>
              );
            } else if (el.type === 'buyerName') {
              renderedContent = 'Maria Santos (Buyer)';
            } else if (el.type === 'solicitorName') {
              renderedContent = 'Juan Dela Cruz (Solicitor)';
            } else if (el.type === 'image' && el.content) {
              renderedContent = (
                <img src={el.content} alt="Element" className="w-full h-full object-contain pointer-events-none" />
              );
            } else {
              renderedContent = el.content || 'Text Element';
            }

            const fontSizeScaled = (el.style.fontSize || 14) * 0.9 * zoom;

            return (
              <div
                key={el.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectElement(el.id);
                }}
                onMouseDown={(e) => handleElementMouseDown(e, el)}
                style={{
                  position: 'absolute',
                  left: `${elPxX}px`,
                  top: `${elPxY}px`,
                  width: `${elPxW}px`,
                  height: `${elPxH}px`,
                  zIndex: el.zIndex,
                  opacity: el.opacity,
                  transformOrigin: 'center center',
                  transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                  fontFamily: el.style.fontFamily || 'Inter',
                  fontSize: `${fontSizeScaled}px`,
                  fontWeight: el.style.fontWeight || 'normal',
                  fontStyle: el.style.italic ? 'italic' : 'normal',
                  textDecoration: el.style.underline ? 'underline' : 'none',
                  color: el.style.color || '#111111',
                  textAlign: el.style.alignment || 'left',
                  letterSpacing: el.style.letterSpacing ? `${el.style.letterSpacing * zoom}px` : undefined,
                  cursor: el.locked ? 'pointer' : 'move',
                }}
                className={`group flex items-center select-none ${
                  el.style.alignment === 'center'
                    ? 'justify-center'
                    : el.style.alignment === 'right'
                    ? 'justify-end'
                    : 'justify-start'
                } ${
                  isSelected
                    ? 'ring-2 ring-[#F97316] ring-offset-1 z-30'
                    : 'hover:ring-1 hover:ring-neutral-400'
                }`}
              >
                {/* Element Content */}
                <div className="w-full h-full overflow-hidden flex items-center leading-tight pointer-events-none">
                  {renderedContent}
                </div>

                {/* Selection Indicators, Rotate & Resize Handles */}
                {isSelected && (
                  <>
                    {/* Badge Label */}
                    <div className="absolute -top-5 left-0 bg-[#F97316] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none z-40 flex items-center gap-1">
                      {el.locked && <Lock className="w-2.5 h-2.5" />}
                      <span>{el.type === 'ticketNumber' ? 'Ticket No.' : el.type}</span>
                    </div>

                    {/* Top Center Rotate Handle (Click to rotate 90°) */}
                    {!el.locked && (
                      <>
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-2.5 bg-[#F97316] pointer-events-none z-30" />
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            const newRot = ((el.rotation || 0) + 90) % 360;
                            onUpdateElement(el.id, { rotation: newRot });
                          }}
                          title="Click to Rotate 90°"
                          className="absolute -top-7 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 border-[#F97316] text-[#ea580c] flex items-center justify-center cursor-pointer shadow-sm hover:scale-115 hover:bg-orange-50 transition-all z-40"
                        >
                          <RotateCw className="w-2.5 h-2.5" />
                        </button>
                      </>
                    )}

                    {/* Bottom Right Resize Handle */}
                    {!el.locked && (
                      <div
                        onMouseDown={(e) => handleResizeHandleMouseDown(e, el, 'se')}
                        className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-white border-2 border-[#F97316] rounded-sm cursor-se-resize shadow-xs z-40"
                      />
                    )}
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
