import React, { useEffect, useState } from 'react';
import { TicketDesign } from '../../types/designer';
import { Ticket } from '../../types/ticket';
import { Booklet } from '../../types/booklet';
import { qrService } from '../../services/qr/qrService';

interface SingleTicketRenderProps {
  design: TicketDesign;
  ticket?: Ticket;
  booklet?: Booklet;
  resolvedSolicitor?: string;
  resolvedBuyer?: string;
  scale?: number; // scale multiplier if rendering in preview mode vs physical print
  className?: string;
}

export const SingleTicketRender: React.FC<SingleTicketRenderProps> = ({
  design,
  ticket,
  booklet,
  resolvedSolicitor = '',
  resolvedBuyer = '',
  scale = 1,
  className = '',
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Generate real unique QR code for this ticket
  useEffect(() => {
    let isMounted = true;
    if (ticket) {
      qrService.toDataURL(ticket.qrValue, { width: 180, margin: 1 }).then((url) => {
        if (isMounted) setQrDataUrl(url);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [ticket?.id, ticket?.qrValue]);

  // Dimensions in millimeters for accurate physical printing
  const widthMm = design.widthMm;
  const heightMm = design.heightMm;

  return (
    <div
      className={`print-ticket-item relative overflow-hidden bg-white select-none ${className}`}
      style={{
        width: `${widthMm * scale}mm`,
        height: `${heightMm * scale}mm`,
        backgroundColor: design.backgroundColor || '#FFFFFF',
      }}
    >
      {/* Background image */}
      {design.backgroundImageUrl && (
        <img
          src={design.backgroundImageUrl}
          alt="Ticket Design"
          className="absolute inset-0 w-full h-full object-fill pointer-events-none z-0"
        />
      )}

      {/* Render elements */}
      {design.elements
        .filter((el) => el.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((el) => {
          let content: React.ReactNode = null;

          if (el.type === 'ticketNumber') {
            content = ticket ? ticket.ticketNumber : (el.numberFormat?.sampleValue || '0001');
          } else if (el.type === 'qrCode') {
            content = qrDataUrl ? (
              <img src={qrDataUrl} alt="Ticket QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-neutral-200 animate-pulse" />
            );
          } else if (el.type === 'buyerName') {
            content = resolvedBuyer || ticket?.buyerName || booklet?.buyerName || '';
          } else if (el.type === 'solicitorName') {
            content = resolvedSolicitor || ticket?.solicitorName || booklet?.solicitorName || '';
          } else if (el.type === 'image' && el.content) {
            content = <img src={el.content} alt="Logo" className="w-full h-full object-contain" />;
          } else {
            content = el.content || '';
          }

          // Scaled font size in millimeters or points
          const fontSizePt = (el.style.fontSize || 14) * scale;

          return (
            <div
              key={el.id}
              style={{
                position: 'absolute',
                left: `${el.x * scale}mm`,
                top: `${el.y * scale}mm`,
                width: `${el.width * scale}mm`,
                height: `${el.height * scale}mm`,
                zIndex: el.zIndex,
                opacity: el.opacity,
                transformOrigin: 'center center',
                transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
                fontFamily: el.style.fontFamily || 'Inter',
                fontSize: `${fontSizePt}pt`,
                fontWeight: el.style.fontWeight || 'normal',
                fontStyle: el.style.italic ? 'italic' : 'normal',
                textDecoration: el.style.underline ? 'underline' : 'none',
                color: el.style.color || '#111111',
                textAlign: el.style.alignment || 'left',
                letterSpacing: el.style.letterSpacing ? `${el.style.letterSpacing * scale}px` : undefined,
              }}
              className={`flex items-center leading-none overflow-hidden ${
                el.style.alignment === 'center'
                  ? 'justify-center'
                  : el.style.alignment === 'right'
                  ? 'justify-end'
                  : 'justify-start'
              }`}
            >
              {content}
            </div>
          );
        })}
    </div>
  );
};
