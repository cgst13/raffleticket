import React from 'react';
import {
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Eye,
  Save,
  Loader2,
  SlidersHorizontal,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface DesignerToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitZoom: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onPreview: () => void;
  onSave: () => void;
  isSaving: boolean;
  widthMm: number;
  heightMm: number;
  onConfigureDimensions?: () => void;
  onBack?: () => void;
}

export const DesignerToolbar: React.FC<DesignerToolbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitZoom,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  onPreview,
  onSave,
  isSaving,
  widthMm,
  heightMm,
  onConfigureDimensions,
  onBack,
}) => {
  return (
    <div className="h-14 bg-white border-b border-[#E5E5E5] px-4 flex items-center justify-between select-none shrink-0 no-print gap-3 overflow-x-auto">
      {/* Left: Back + Undo/Redo & Dimensions */}
      <div className="flex items-center gap-2 shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] text-xs font-bold text-neutral-700 hover:text-[#ea580c] hover:bg-orange-50/70 transition-colors mr-1"
            title="Back to Raffle Event"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#F97316]" />
            <span>Back</span>
          </button>
        )}

        <div className="flex items-center border border-[#E5E5E5] rounded-lg p-0.5 bg-neutral-50">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 rounded hover:bg-white transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 disabled:opacity-30 rounded hover:bg-white transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Dimension indicator / button */}
        <button
          onClick={onConfigureDimensions}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors"
          title="Configure Ticket Size"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
          <span>
            {widthMm} × {heightMm} mm
          </span>
        </button>
      </div>

      {/* Center: Zoom & Grid controls */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center border border-[#E5E5E5] rounded-lg p-0.5 bg-neutral-50">
          <button
            onClick={onZoomOut}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded hover:bg-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={onResetZoom}
            className="px-2 py-1 text-xs font-mono font-semibold text-neutral-800 hover:bg-white rounded transition-colors"
            title="Reset Zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={onZoomIn}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded hover:bg-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onFitZoom}
            className="p-1.5 text-neutral-600 hover:text-neutral-900 rounded hover:bg-white transition-colors"
            title="Fit to Screen"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center border border-[#E5E5E5] rounded-lg p-0.5 bg-neutral-50">
          <button
            onClick={onToggleGrid}
            className={`p-1.5 rounded transition-colors ${
              showGrid ? 'bg-orange-100 text-[#ea580c]' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleSnap}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
              snapToGrid ? 'bg-orange-100 text-[#ea580c]' : 'text-neutral-500 hover:text-neutral-800 hover:bg-white'
            }`}
            title="Toggle Snap to Grid (5mm)"
          >
            Snap
          </button>
        </div>
      </div>

      {/* Right: Preview & Save */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onPreview}
          leftIcon={<Eye className="w-4 h-4" />}
        >
          Preview
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={isSaving}
          leftIcon={isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        >
          Save Design
        </Button>
      </div>
    </div>
  );
};
