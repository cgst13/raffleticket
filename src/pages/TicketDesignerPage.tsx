import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { TicketDesign, DesignElement, DesignElementType, ValidationWarning } from '../types/designer';
import { designRepository } from '../services/storage/designRepository';
import { rafflesRepository } from '../services/storage/rafflesRepository';
import { DesignerToolbar } from '../components/designer/DesignerToolbar';
import { ElementTools } from '../components/designer/ElementTools';
import { TicketCanvas } from '../components/designer/TicketCanvas';
import { PropertiesPanel } from '../components/designer/PropertiesPanel';
import { LayersPanel } from '../components/designer/LayersPanel';
import { ValidationWarnings } from '../components/designer/ValidationWarnings';
import { SingleTicketRender } from '../components/printing/SingleTicketRender';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useToast } from '../context/ToastContext';
import { ArrowLeft } from 'lucide-react';

export const TicketDesignerPage: React.FC = () => {
  const { raffleId } = useParams<{ raffleId: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [design, setDesign] = useState<TicketDesign | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<'elements' | 'layers'>('elements');

  // Toolbar & Canvas states
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDimensionsModalOpen, setIsDimensionsModalOpen] = useState(false);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<TicketDesign[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Validation Warnings
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);

  useEffect(() => {
    if (!raffleId) return;
    const raffle = rafflesRepository.getById(raffleId);
    if (!raffle) {
      navigate('/raffles');
      return;
    }

    let loaded = designRepository.getByRaffleId(raffleId);
    if (!loaded) {
      // Create initial design if none exists
      loaded = {
        id: `design_${raffleId}`,
        raffleId,
        name: `${raffle.raffleName} Design`,
        widthMm: 140,
        heightMm: 50,
        backgroundImageUrl: '/sample-ticket-bg.svg',
        backgroundColor: '#FFFDF9',
        elements: [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    setDesign(loaded);
    setHistory([loaded]);
    setHistoryIndex(0);
  }, [raffleId, navigate]);

  // Push new state to history
  const pushState = (newDesign: TicketDesign) => {
    setDesign(newDesign);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newDesign);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setDesign(prev);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setDesign(next);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Real-time Validation (Section 18)
  useEffect(() => {
    if (!design) return;
    const newWarns: ValidationWarning[] = [];

    const hasNumber = design.elements.some((el) => el.type === 'ticketNumber');
    if (!hasNumber) {
      newWarns.push({
        id: 'warn_missing_number',
        type: 'error',
        message: 'Ticket Number element is missing! Add a dynamic Ticket Number element to the design.',
      });
    }

    const hasQr = design.elements.some((el) => el.type === 'qrCode');
    if (!hasQr) {
      newWarns.push({
        id: 'warn_missing_qr',
        type: 'error',
        message: 'Dynamic QR Code element is missing! Add a QR Code for scanning and ticket authentication.',
      });
    }

    // Check bounds
    design.elements.forEach((el) => {
      if (el.x + el.width > design.widthMm + 2 || el.y + el.height > design.heightMm + 2) {
        newWarns.push({
          id: `warn_bounds_${el.id}`,
          type: 'warning',
          message: `Element "${el.type}" extends past the ticket boundaries.`,
          elementId: el.id,
        });
      }
    });

    setWarnings(newWarns);
  }, [design]);

  if (!design) return null;

  // Add Element
  const handleAddElement = (type: DesignElementType, customProps: any = {}) => {
    const highestZ = design.elements.length > 0 ? Math.max(...design.elements.map((e) => e.zIndex)) : 0;
    const id = `elem_${type}_${uuidv4().slice(0, 6)}`;

    let defaultWidth = 35;
    let defaultHeight = 8;
    let defaultStyle: any = {
      fontFamily: 'Inter',
      fontSize: 12,
      fontWeight: 'normal',
      color: '#111111',
      alignment: 'left',
    };

    if (type === 'ticketNumber') {
      defaultWidth = 35;
      defaultHeight = 8;
      defaultStyle = {
        fontFamily: 'JetBrains Mono',
        fontSize: 18,
        fontWeight: '800',
        color: '#111111',
        alignment: 'right',
        letterSpacing: 1.5,
      };
    } else if (type === 'qrCode') {
      defaultWidth = 22;
      defaultHeight = 22;
      defaultStyle = {};
    } else if (type === 'buyerName' || type === 'solicitorName') {
      defaultWidth = 30;
      defaultHeight = 6;
      defaultStyle = {
        fontFamily: 'Inter',
        fontSize: 10,
        fontWeight: '600',
        color: '#111111',
      };
    } else if (type === 'image') {
      defaultWidth = 25;
      defaultHeight = 25;
    }

    const newElement: DesignElement = {
      id,
      type,
      x: 10,
      y: 10,
      width: defaultWidth,
      height: defaultHeight,
      rotation: 0,
      opacity: 1,
      zIndex: highestZ + 1,
      locked: false,
      visible: true,
      content: customProps.content || (type === 'text' ? 'Official Raffle Ticket' : ''),
      style: defaultStyle,
      numberFormat: type === 'ticketNumber' ? { prefix: '', padding: 6, sampleValue: '000001' } : undefined,
      qrConfig: type === 'qrCode' ? { errorCorrection: 'M', foreground: '#000000', background: '#FFFFFF', padding: 1 } : undefined,
      ...customProps,
    };

    const updated = { ...design, elements: [...design.elements, newElement] };
    pushState(updated);
    setSelectedId(id);
    toast.info(`Added ${type} element.`);
  };

  // Update Element
  const handleUpdateElement = (id: string, updates: Partial<DesignElement>) => {
    const updatedElements = design.elements.map((el) => {
      if (el.id === id) {
        return { ...el, ...updates };
      }
      return el;
    });
    pushState({ ...design, elements: updatedElements });
  };

  // Duplicate Element
  const handleDuplicateElement = (id: string) => {
    const target = design.elements.find((e) => e.id === id);
    if (!target) return;

    const highestZ = Math.max(...design.elements.map((e) => e.zIndex));
    const duplicated: DesignElement = {
      ...target,
      id: `elem_${target.type}_${uuidv4().slice(0, 6)}`,
      x: Math.min(design.widthMm - target.width, target.x + 4),
      y: Math.min(design.heightMm - target.height, target.y + 4),
      zIndex: highestZ + 1,
    };

    pushState({ ...design, elements: [...design.elements, duplicated] });
    setSelectedId(duplicated.id);
  };

  // Delete Element
  const handleDeleteElement = (id: string) => {
    const filtered = design.elements.filter((e) => e.id !== id);
    pushState({ ...design, elements: filtered });
    if (selectedId === id) setSelectedId(null);
  };

  // Reorder Layer
  const handleMoveLayer = (id: string, direction: 'up' | 'down') => {
    const elements = [...design.elements].sort((a, b) => a.zIndex - b.zIndex);
    const index = elements.findIndex((e) => e.id === id);
    if (index === -1) return;

    if (direction === 'up' && index < elements.length - 1) {
      const tempZ = elements[index].zIndex;
      elements[index].zIndex = elements[index + 1].zIndex;
      elements[index + 1].zIndex = tempZ;
    } else if (direction === 'down' && index > 0) {
      const tempZ = elements[index].zIndex;
      elements[index].zIndex = elements[index - 1].zIndex;
      elements[index - 1].zIndex = tempZ;
    }

    pushState({ ...design, elements });
  };

  // Background Upload
  const handleUploadBackground = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      pushState({ ...design, backgroundImageUrl: reader.result as string });
      toast.success('Ticket background updated.');
    };
    reader.readAsDataURL(file);
  };

  const handleUseSampleBackground = () => {
    pushState({ ...design, backgroundImageUrl: '/sample-ticket-bg.svg' });
    toast.success('Applied sample Grand Raffle background.');
  };

  // Save Design
  const handleSave = () => {
    setIsSaving(true);
    try {
      designRepository.save(design);
      toast.success('Ticket design saved successfully!');
    } catch (e) {
      toast.error('Failed to save design to storage.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedElement = design.elements.find((e) => e.id === selectedId) || null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">
      {/* Top Header & Breadcrumb */}
      <div className="h-10 px-4 bg-neutral-50 border-b border-[#E5E5E5] flex items-center justify-between text-xs text-neutral-500 shrink-0">
        <button
          onClick={() => navigate(`/raffles/${raffleId}`)}
          className="flex items-center gap-1.5 hover:text-neutral-900 font-semibold transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit Designer</span>
        </button>
        <span className="font-medium text-neutral-700">{design.name}</span>
      </div>

      {/* Toolbar */}
      <DesignerToolbar
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(2.5, z + 0.15))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.15))}
        onResetZoom={() => setZoom(1)}
        onFitZoom={() => setZoom(1.2)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid(!showGrid)}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(!snapToGrid)}
        onPreview={() => setIsPreviewOpen(true)}
        onSave={handleSave}
        isSaving={isSaving}
        widthMm={design.widthMm}
        heightMm={design.heightMm}
        onConfigureDimensions={() => setIsDimensionsModalOpen(true)}
        onBack={() => navigate(`/raffles/${raffleId}`)}
      />

      {/* Validation Warnings Bar */}
      {warnings.length > 0 && (
        <div className="px-4 py-2 border-b border-[#E5E5E5] bg-amber-50/50 shrink-0">
          <ValidationWarnings warnings={warnings} />
        </div>
      )}

      {/* Main Designer Area: Left Tools + Center Canvas + Right Properties */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Tools & Layers */}
        {activeLeftTab === 'elements' ? (
          <ElementTools
            onAddElement={handleAddElement}
            onUploadBackground={handleUploadBackground}
            onUseSampleBackground={handleUseSampleBackground}
            activeTab={activeLeftTab}
            setActiveTab={setActiveLeftTab}
          />
        ) : (
          <div className="w-56 bg-white border-r border-[#E5E5E5] flex flex-col shrink-0">
            <div className="flex border-b border-[#E5E5E5] p-2 gap-1 bg-neutral-50/50">
              <button
                onClick={() => setActiveLeftTab('elements')}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold text-neutral-500 hover:text-neutral-800"
              >
                Elements
              </button>
              <button
                onClick={() => setActiveLeftTab('layers')}
                className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-white text-[#111111] shadow-xs border border-[#E5E5E5]"
              >
                Layers
              </button>
            </div>
            <LayersPanel
              elements={design.elements}
              selectedId={selectedId}
              onSelectElement={setSelectedId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onMoveLayer={handleMoveLayer}
            />
          </div>
        )}

        {/* Center Interactive Canvas */}
        <TicketCanvas
          design={design}
          selectedId={selectedId}
          onSelectElement={setSelectedId}
          onUpdateElement={handleUpdateElement}
          zoom={zoom}
          showGrid={showGrid}
          snapToGrid={snapToGrid}
        />

        {/* Right Properties Panel */}
        <PropertiesPanel
          element={selectedElement}
          canvasWidthMm={design.widthMm}
          canvasHeightMm={design.heightMm}
          onUpdateElement={handleUpdateElement}
          onDuplicateElement={handleDuplicateElement}
          onDeleteElement={handleDeleteElement}
        />
      </div>

      {/* Ticket Size Dimensions Modal */}
      <Modal
        isOpen={isDimensionsModalOpen}
        onClose={() => setIsDimensionsModalOpen(false)}
        title="Configure Ticket Dimensions"
        description="Set the physical millimeter dimensions of your printed ticket."
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Width (mm)"
              type="number"
              value={design.widthMm}
              onChange={(e) =>
                pushState({ ...design, widthMm: Math.max(50, Number(e.target.value)) })
              }
            />
            <Input
              label="Height (mm)"
              type="number"
              value={design.heightMm}
              onChange={(e) =>
                pushState({ ...design, heightMm: Math.max(25, Number(e.target.value)) })
              }
            />
          </div>
          <div className="p-2.5 bg-neutral-50 rounded text-neutral-500">
            Standard Philippine raffle ticket is typically <strong>140mm × 50mm</strong> with a left stub.
          </div>
          <div className="flex justify-end pt-2 border-t border-[#E5E5E5]">
            <Button variant="primary" size="sm" onClick={() => setIsDimensionsModalOpen(false)}>
              Apply Dimensions
            </Button>
          </div>
        </div>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Ticket Design Preview"
        description="Visual render with sample dynamic values and QR code."
        maxWidth="lg"
      >
        <div className="p-4 bg-neutral-100 rounded-xl flex items-center justify-center overflow-auto">
          <div className="shadow-xl">
            <SingleTicketRender
              design={design}
              scale={1.3}
              resolvedSolicitor="Juan Dela Cruz (Sample)"
              resolvedBuyer="Maria Santos (Sample)"
            />
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t border-[#E5E5E5]">
          <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
            Close Preview
          </Button>
        </div>
      </Modal>
    </div>
  );
};
