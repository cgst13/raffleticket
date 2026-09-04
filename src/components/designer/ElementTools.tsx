import React, { useRef } from 'react';
import {
  Type,
  Image as ImageIcon,
  Hash,
  QrCode,
  User,
  UserCheck,
  Upload,
  Layers,
} from 'lucide-react';
import { DesignElementType } from '../../types/designer';

interface ElementToolsProps {
  onAddElement: (type: DesignElementType, customProps?: any) => void;
  onUploadBackground: (file: File) => void;
  onUseSampleBackground: () => void;
  activeTab: 'elements' | 'layers';
  setActiveTab: (tab: 'elements' | 'layers') => void;
}

export const ElementTools: React.FC<ElementToolsProps> = ({
  onAddElement,
  onUploadBackground,
  onUseSampleBackground,
  activeTab,
  setActiveTab,
}) => {
  const bgInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleImageElementUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onAddElement('image', { content: reader.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadBackground(file);
    }
    e.target.value = '';
  };

  const tools = [
    {
      type: 'ticketNumber' as DesignElementType,
      label: 'Ticket Number',
      desc: 'Dynamic sequenced number',
      icon: <Hash className="w-4 h-4 text-[#F97316]" />,
      badge: 'Dynamic',
    },
    {
      type: 'qrCode' as DesignElementType,
      label: 'QR Code',
      desc: 'Unique validation code',
      icon: <QrCode className="w-4 h-4 text-neutral-900" />,
      badge: 'Dynamic',
    },
    {
      type: 'buyerName' as DesignElementType,
      label: 'Buyer Name',
      desc: 'Dynamic buyer field',
      icon: <User className="w-4 h-4 text-emerald-600" />,
      badge: 'Dynamic',
    },
    {
      type: 'solicitorName' as DesignElementType,
      label: 'Solicitor Name',
      desc: 'Dynamic solicitor field',
      icon: <UserCheck className="w-4 h-4 text-indigo-600" />,
      badge: 'Dynamic',
    },
    {
      type: 'text' as DesignElementType,
      label: 'Static Text',
      desc: 'Custom text & labels',
      icon: <Type className="w-4 h-4 text-neutral-600" />,
    },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E5E5E5] w-56 shrink-0 select-none">
      {/* Tab Switcher */}
      <div className="flex border-b border-[#E5E5E5] p-2 gap-1 bg-neutral-50/50">
        <button
          onClick={() => setActiveTab('elements')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'elements'
              ? 'bg-white text-[#111111] shadow-xs border border-[#E5E5E5]'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span>Elements</span>
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
            activeTab === 'layers'
              ? 'bg-white text-[#111111] shadow-xs border border-[#E5E5E5]'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>
      </div>

      {activeTab === 'elements' && (
        <div className="p-3 space-y-4 overflow-y-auto flex-1">
          {/* Background Upload Section */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">
              Ticket Background
            </span>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={handleBackgroundUpload}
            />
            <button
              onClick={() => bgInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-neutral-300 hover:border-[#F97316] hover:bg-orange-50/40 text-xs font-semibold text-neutral-700 transition-all"
            >
              <Upload className="w-4 h-4 text-[#F97316]" />
              <span>Upload Design (PNG/JPG)</span>
            </button>
            <button
              onClick={onUseSampleBackground}
              className="w-full text-center text-[11px] font-medium text-[#c2410c] hover:underline"
            >
              Use Sample Grand Raffle BG
            </button>
          </div>

          {/* Add Elements Section */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-2">
              Add Elements
            </span>
            {tools.map((t) => (
              <button
                key={t.type}
                onClick={() => onAddElement(t.type)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E5E5E5] hover:border-[#F97316] hover:bg-orange-50/30 text-left transition-all group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-neutral-100 group-hover:bg-white group-hover:shadow-xs transition-colors">
                    {t.icon}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-neutral-900 group-hover:text-[#ea580c]">
                      {t.label}
                    </div>
                    <div className="text-[10px] text-neutral-500">{t.desc}</div>
                  </div>
                </div>
                {t.badge && (
                  <span className="text-[9px] font-bold bg-orange-100 text-[#ea580c] px-1.5 py-0.5 rounded">
                    {t.badge}
                  </span>
                )}
              </button>
            ))}

            {/* Upload Logo / Image Element */}
            <input
              ref={imgInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageElementUpload}
            />
            <button
              onClick={() => imgInputRef.current?.click()}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-[#E5E5E5] hover:border-[#F97316] hover:bg-orange-50/30 text-left transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-neutral-100 group-hover:bg-white transition-colors">
                  <ImageIcon className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-neutral-900 group-hover:text-[#ea580c]">
                    Image / Logo
                  </div>
                  <div className="text-[10px] text-neutral-500">Insert sponsor or seal</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
