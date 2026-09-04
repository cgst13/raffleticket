import React from 'react';
import { DesignElement } from '../../types/designer';
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  Hash,
  QrCode,
  User,
  UserCheck,
  Type,
  Image as ImageIcon,
} from 'lucide-react';

interface LayersPanelProps {
  elements: DesignElement[];
  selectedId: string | null;
  onSelectElement: (id: string) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (id: string) => void;
  onMoveLayer: (id: string, direction: 'up' | 'down') => void;
}

export const LayersPanel: React.FC<LayersPanelProps> = ({
  elements,
  selectedId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onMoveLayer,
}) => {
  // Sort elements descending by zIndex for top-to-bottom rendering
  const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);

  const getElementIcon = (type: DesignElement['type']) => {
    switch (type) {
      case 'ticketNumber':
        return <Hash className="w-3.5 h-3.5 text-[#F97316]" />;
      case 'qrCode':
        return <QrCode className="w-3.5 h-3.5 text-neutral-800" />;
      case 'buyerName':
        return <User className="w-3.5 h-3.5 text-emerald-600" />;
      case 'solicitorName':
        return <UserCheck className="w-3.5 h-3.5 text-indigo-600" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Type className="w-3.5 h-3.5 text-neutral-600" />;
    }
  };

  const getElementTitle = (el: DesignElement) => {
    switch (el.type) {
      case 'ticketNumber':
        return 'Ticket Number';
      case 'qrCode':
        return 'QR Code';
      case 'buyerName':
        return 'Buyer Name';
      case 'solicitorName':
        return 'Solicitor Name';
      case 'image':
        return 'Image / Logo';
      default:
        return el.content || 'Text Element';
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-neutral-400">
        No elements on canvas.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-1 overflow-y-auto flex-1">
      <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block px-2 py-1">
        Layers ({sorted.length})
      </span>
      {sorted.map((el, idx) => {
        const isSelected = el.id === selectedId;
        return (
          <div
            key={el.id}
            onClick={() => onSelectElement(el.id)}
            className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
              isSelected
                ? 'bg-orange-50 border-[#F97316] text-[#c2410c] font-semibold'
                : 'bg-white border-[#E5E5E5] text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              {getElementIcon(el.type)}
              <span className="truncate max-w-[95px]">{getElementTitle(el)}</span>
            </div>

            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => onMoveLayer(el.id, 'up')}
                disabled={idx === 0}
                className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30 rounded"
                title="Bring Forward"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onMoveLayer(el.id, 'down')}
                disabled={idx === sorted.length - 1}
                className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30 rounded"
                title="Send Backward"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onUpdateElement(el.id, { locked: !el.locked })}
                className={`p-1 rounded ${
                  el.locked ? 'text-amber-600' : 'text-neutral-400 hover:text-neutral-700'
                }`}
                title={el.locked ? 'Unlock' : 'Lock'}
              >
                {el.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onUpdateElement(el.id, { visible: !el.visible })}
                className={`p-1 rounded ${
                  !el.visible ? 'text-red-500' : 'text-neutral-400 hover:text-neutral-700'
                }`}
                title={el.visible ? 'Hide' : 'Show'}
              >
                {el.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => onDeleteElement(el.id)}
                className="p-1 text-neutral-400 hover:text-red-600 rounded"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
