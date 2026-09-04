import React from 'react';
import { DesignElement } from '../../types/designer';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Maximize2,
  RotateCw,
  RotateCcw,
  Compass,
} from 'lucide-react';

interface PropertiesPanelProps {
  element: DesignElement | null;
  canvasWidthMm: number;
  canvasHeightMm: number;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDuplicateElement: (id: string) => void;
  onDeleteElement: (id: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  canvasWidthMm,
  canvasHeightMm,
  onUpdateElement,
  onDuplicateElement,
  onDeleteElement,
}) => {
  if (!element) {
    return (
      <div className="w-64 bg-white border-l border-[#E5E5E5] p-5 flex flex-col items-center justify-center text-center text-neutral-400 select-none shrink-0">
        <div className="w-10 h-10 rounded-full bg-neutral-50 border border-neutral-200 flex items-center justify-center mb-2 text-neutral-300">
          <Maximize2 className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-neutral-500">No element selected</p>
        <p className="text-[11px] text-neutral-400 mt-0.5">Click any element on the ticket to adjust its properties</p>
      </div>
    );
  }

  const isTextType = ['text', 'ticketNumber', 'buyerName', 'solicitorName'].includes(element.type);

  const handleCenterHorizontal = () => {
    const newX = Math.max(0, Math.round((canvasWidthMm - element.width) / 2));
    onUpdateElement(element.id, { x: newX });
  };

  const handleCenterVertical = () => {
    const newY = Math.max(0, Math.round((canvasHeightMm - element.height) / 2));
    onUpdateElement(element.id, { y: newY });
  };

  return (
    <div className="w-64 bg-white border-l border-[#E5E5E5] flex flex-col h-full overflow-y-auto shrink-0 select-none text-xs">
      {/* Header with Title and Quick Actions */}
      <div className="p-3.5 border-b border-[#E5E5E5] flex items-center justify-between bg-neutral-50/50">
        <div>
          <span className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider block">
            {element.type === 'ticketNumber' ? 'Ticket Number' : element.type}
          </span>
          <h4 className="font-semibold text-neutral-900 capitalize">Properties</h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onUpdateElement(element.id, { locked: !element.locked })}
            className={`p-1.5 rounded hover:bg-neutral-200 transition-colors ${
              element.locked ? 'text-amber-600' : 'text-neutral-500'
            }`}
            title={element.locked ? 'Unlock element' : 'Lock element'}
          >
            {element.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onDuplicateElement(element.id)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-200 transition-colors"
            title="Duplicate"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteElement(element.id)}
            className="p-1.5 text-neutral-500 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-3.5 space-y-4">
        {/* Alignment & Centering Shortcuts */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Quick Alignment
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCenterHorizontal}
              className="py-1.5 px-2 text-center rounded border border-[#E5E5E5] hover:border-neutral-400 bg-white font-medium hover:bg-neutral-50 transition-colors"
            >
              Center Horizontally
            </button>
            <button
              onClick={handleCenterVertical}
              className="py-1.5 px-2 text-center rounded border border-[#E5E5E5] hover:border-neutral-400 bg-white font-medium hover:bg-neutral-50 transition-colors"
            >
              Center Vertically
            </button>
          </div>
        </div>

        {/* Position & Size (mm) */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
            Position & Size (mm)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-500 block mb-0.5">X Position</label>
              <input
                type="number"
                value={Math.round(element.x)}
                onChange={(e) => onUpdateElement(element.id, { x: Number(e.target.value) })}
                className="w-full px-2 py-1.5 rounded border border-[#E5E5E5] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 block mb-0.5">Y Position</label>
              <input
                type="number"
                value={Math.round(element.y)}
                onChange={(e) => onUpdateElement(element.id, { y: Number(e.target.value) })}
                className="w-full px-2 py-1.5 rounded border border-[#E5E5E5] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 block mb-0.5">Width</label>
              <input
                type="number"
                value={Math.round(element.width)}
                onChange={(e) => onUpdateElement(element.id, { width: Math.max(5, Number(e.target.value)) })}
                className="w-full px-2 py-1.5 rounded border border-[#E5E5E5] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-500 block mb-0.5">Height</label>
              <input
                type="number"
                value={Math.round(element.height)}
                onChange={(e) => onUpdateElement(element.id, { height: Math.max(4, Number(e.target.value)) })}
                className="w-full px-2 py-1.5 rounded border border-[#E5E5E5] focus:outline-none focus:ring-1 focus:ring-[#F97316]"
              />
            </div>
          </div>
        </div>

        {/* Rotation & Orientation Controls */}
        <div className="space-y-2 p-2.5 rounded-lg bg-neutral-50 border border-[#E5E5E5]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-700 uppercase tracking-wider flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-[#F97316]" />
              Rotation / Angle
            </span>
            <span className="text-[11px] font-mono font-bold text-[#ea580c] bg-orange-100/70 px-1.5 py-0.5 rounded">
              {element.rotation || 0}°
            </span>
          </div>

          {/* 4 Standard Angle Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { deg: 0, label: '0° Horiz' },
              { deg: 90, label: '90° Vert' },
              { deg: 180, label: '180°' },
              { deg: 270, label: '270° Vert' },
            ].map(({ deg, label }) => {
              const isCurrent = ((element.rotation || 0) % 360 + 360) % 360 === deg;
              return (
                <button
                  key={deg}
                  type="button"
                  onClick={() => onUpdateElement(element.id, { rotation: deg })}
                  className={`py-1.5 px-0.5 text-center rounded border text-[11px] font-semibold transition-all ${
                    isCurrent
                      ? 'bg-orange-100 border-[#F97316] text-[#ea580c] font-bold shadow-xs'
                      : 'bg-white border-[#E5E5E5] text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Quick Increment/Decrement Buttons */}
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                const current = element.rotation || 0;
                const next = ((current - 90) % 360 + 360) % 360;
                onUpdateElement(element.id, { rotation: next });
              }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded border border-[#E5E5E5] hover:bg-white bg-neutral-100 text-neutral-700 text-xs font-medium transition-colors"
              title="Rotate 90° Counter-Clockwise"
            >
              <RotateCcw className="w-3.5 h-3.5 text-neutral-500" />
              <span>-90°</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const current = element.rotation || 0;
                const next = (current + 90) % 360;
                onUpdateElement(element.id, { rotation: next });
              }}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded border border-[#E5E5E5] hover:bg-white bg-neutral-100 text-neutral-700 text-xs font-medium transition-colors"
              title="Rotate 90° Clockwise"
            >
              <RotateCw className="w-3.5 h-3.5 text-neutral-500" />
              <span>+90°</span>
            </button>
          </div>

          {/* Precision Degree Slider */}
          <div className="pt-1 flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={360}
              step={5}
              value={element.rotation || 0}
              onChange={(e) => onUpdateElement(element.id, { rotation: Number(e.target.value) })}
              className="w-full accent-[#F97316] cursor-pointer"
            />
          </div>
        </div>

        {/* Static Text Content (if type is text) */}
        {element.type === 'text' && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Text Content
            </label>
            <textarea
              value={element.content || ''}
              onChange={(e) => onUpdateElement(element.id, { content: e.target.value })}
              rows={2}
              className="w-full p-2 rounded border border-[#E5E5E5] text-xs focus:outline-none focus:ring-1 focus:ring-[#F97316]"
            />
          </div>
        )}

        {/* Ticket Number Formatting */}
        {element.type === 'ticketNumber' && (
          <div className="space-y-2 p-2.5 rounded-lg bg-orange-50/60 border border-orange-200">
            <span className="text-[10px] font-bold text-[#c2410c] uppercase tracking-wider block">
              Number Formatting & Stub Orientation
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-600 block mb-0.5">Prefix</label>
                <input
                  type="text"
                  placeholder="e.g. R-"
                  value={element.numberFormat?.prefix || ''}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      numberFormat: { ...element.numberFormat, prefix: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 rounded bg-white border border-orange-200 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-neutral-600 block mb-0.5">Padding Digits</label>
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={element.numberFormat?.padding || 4}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      numberFormat: { ...element.numberFormat, padding: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2 py-1 rounded bg-white border border-orange-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Rotate Left & Right by 90 Degrees */}
            <div className="pt-1 flex items-center justify-between gap-1 text-[11px]">
              <span className="text-neutral-700 font-semibold flex items-center gap-1">
                Rotate:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const current = element.rotation || 0;
                    const next = ((current - 90) % 360 + 360) % 360;
                    onUpdateElement(element.id, { rotation: next });
                  }}
                  className="px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-orange-50 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs active:scale-95"
                  title="Rotate Left 90° (Counter-Clockwise)"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Left (90°)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const current = element.rotation || 0;
                    const next = (current + 90) % 360;
                    onUpdateElement(element.id, { rotation: next });
                  }}
                  className="px-2 py-1 rounded border border-neutral-300 bg-white hover:bg-orange-50 text-neutral-700 text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs active:scale-95"
                  title="Rotate Right 90° (Clockwise)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#F97316]" />
                  <span>Right (90°)</span>
                </button>
                <span className="text-[10px] font-mono text-[#c2410c] font-bold bg-orange-100 px-1.5 py-0.5 rounded ml-0.5">
                  {element.rotation || 0}°
                </span>
              </div>
            </div>

            <div className="text-[11px] text-neutral-600 font-mono bg-white p-1.5 rounded border border-orange-200">
              Sample: {element.numberFormat?.prefix || ''}
              {String(1).padStart(element.numberFormat?.padding || 4, '0')}
              {element.numberFormat?.suffix || ''}
            </div>
          </div>
        )}

        {/* QR Code Specific Properties */}
        {element.type === 'qrCode' && (
          <div className="space-y-2 p-2.5 rounded-lg bg-neutral-50 border border-[#E5E5E5]">
            <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider block">
              QR Code Settings
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Correction Level</label>
                <select
                  value={element.qrConfig?.errorCorrection || 'M'}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      qrConfig: {
                        ...element.qrConfig,
                        errorCorrection: e.target.value as any,
                      },
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-[#E5E5E5] bg-white text-xs"
                >
                  <option value="L">L (7% Recovery)</option>
                  <option value="M">M (15% Recovery)</option>
                  <option value="Q">Q (25% Recovery)</option>
                  <option value="H">H (30% Recovery)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">QR Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={element.qrConfig?.foreground || '#000000'}
                    onChange={(e) =>
                      onUpdateElement(element.id, {
                        qrConfig: { ...element.qrConfig, foreground: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-[#E5E5E5] p-0.5 cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-600 font-mono">
                    {element.qrConfig?.foreground || '#000000'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Typography & Styling for Text Elements */}
        {isTextType && (
          <div className="space-y-2.5 pt-2 border-t border-[#E5E5E5]">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Typography & Style
            </span>

            {/* Font Family & Size */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Font Family</label>
                <select
                  value={element.style.fontFamily || 'Inter'}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      style: { ...element.style, fontFamily: e.target.value },
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-[#E5E5E5] bg-white text-xs"
                >
                  <option value="Inter">Inter</option>
                  <option value="JetBrains Mono">JetBrains Mono</option>
                  <option value="sans-serif">System Sans</option>
                  <option value="serif">Serif</option>
                  <option value="monospace">Monospace</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Font Size (pt)</label>
                <input
                  type="number"
                  min={8}
                  max={72}
                  value={element.style.fontSize || 14}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      style: { ...element.style, fontSize: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-[#E5E5E5] text-xs"
                />
              </div>
            </div>

            {/* Formatting & Alignment Buttons */}
            <div className="flex items-center justify-between gap-1 pt-1">
              <div className="flex items-center border border-[#E5E5E5] rounded p-0.5 bg-white">
                <button
                  onClick={() =>
                    onUpdateElement(element.id, {
                      style: {
                        ...element.style,
                        fontWeight: element.style.fontWeight === 'bold' ? 'normal' : 'bold',
                      },
                    })
                  }
                  className={`p-1 rounded ${
                    element.style.fontWeight === 'bold' || element.style.fontWeight === '800' || element.style.fontWeight === '700'
                      ? 'bg-orange-100 text-[#ea580c]'
                      : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onUpdateElement(element.id, {
                      style: { ...element.style, italic: !element.style.italic },
                    })
                  }
                  className={`p-1 rounded ${
                    element.style.italic ? 'bg-orange-100 text-[#ea580c]' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onUpdateElement(element.id, {
                      style: { ...element.style, underline: !element.style.underline },
                    })
                  }
                  className={`p-1 rounded ${
                    element.style.underline ? 'bg-orange-100 text-[#ea580c]' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                  title="Underline"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-center border border-[#E5E5E5] rounded p-0.5 bg-white">
                <button
                  onClick={() =>
                    onUpdateElement(element.id, {
                      style: { ...element.style, alignment: 'left' },
                    })
                  }
                  className={`p-1 rounded ${
                    element.style.alignment === 'left' || !element.style.alignment
                      ? 'bg-neutral-100 text-neutral-900 font-bold'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onUpdateElement(element.id, {
                      style: { ...element.style, alignment: 'center' },
                    })
                  }
                  className={`p-1 rounded ${
                    element.style.alignment === 'center'
                      ? 'bg-neutral-100 text-neutral-900 font-bold'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() =>
                    onUpdateElement(element.id, {
                      style: { ...element.style, alignment: 'right' },
                    })
                  }
                  className={`p-1 rounded ${
                    element.style.alignment === 'right'
                      ? 'bg-neutral-100 text-neutral-900 font-bold'
                      : 'text-neutral-400 hover:text-neutral-700'
                  }`}
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Color & Letter Spacing */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Text Color</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={element.style.color || '#111111'}
                    onChange={(e) =>
                      onUpdateElement(element.id, {
                        style: { ...element.style, color: e.target.value },
                      })
                    }
                    className="w-7 h-7 rounded border border-[#E5E5E5] p-0.5 cursor-pointer"
                  />
                  <span className="text-[10px] text-neutral-600 font-mono">
                    {element.style.color || '#111111'}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-neutral-500 block mb-0.5">Letter Spacing</label>
                <input
                  type="number"
                  step={0.5}
                  value={element.style.letterSpacing || 0}
                  onChange={(e) =>
                    onUpdateElement(element.id, {
                      style: { ...element.style, letterSpacing: Number(e.target.value) },
                    })
                  }
                  className="w-full px-2 py-1 rounded border border-[#E5E5E5] text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
