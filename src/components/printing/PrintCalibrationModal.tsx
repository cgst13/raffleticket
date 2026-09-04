import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { CalibrationOffsetMm } from '../../types/printLayout';
import { Sliders } from 'lucide-react';

interface PrintCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  calibration: CalibrationOffsetMm;
  onSave: (calibration: CalibrationOffsetMm) => void;
}

export const PrintCalibrationModal: React.FC<PrintCalibrationModalProps> = ({
  isOpen,
  onClose,
  calibration,
  onSave,
}) => {
  const [formData, setFormData] = useState<CalibrationOffsetMm>({ ...calibration });

  const handleReset = () => {
    setFormData({ offsetX: 0, offsetY: 0, gapAdjustX: 0, gapAdjustY: 0 });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#F97316]" />
          <span>Printer Alignment Calibration</span>
        </div>
      }
      description="Fine-tune physical margins and spacing in millimeters to compensate for printer hardware variations."
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        <div className="p-3 bg-neutral-50 rounded-lg border border-[#E5E5E5] text-neutral-600">
          Enter small positive or negative millimeter values (e.g. +1.5 or -2.0) to shift printed sheets or adjust ticket gap spacing.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-neutral-700 block mb-1">X Offset (Horizontal Shift mm)</label>
            <input
              type="number"
              step={0.5}
              value={formData.offsetX}
              onChange={(e) => setFormData({ ...formData, offsetX: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
            <span className="text-[10px] text-neutral-400 mt-0.5 block">Positive moves right, negative moves left</span>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Y Offset (Vertical Shift mm)</label>
            <input
              type="number"
              step={0.5}
              value={formData.offsetY}
              onChange={(e) => setFormData({ ...formData, offsetY: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
            <span className="text-[10px] text-neutral-400 mt-0.5 block">Positive moves down, negative moves up</span>
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Horizontal Gap Adjust (mm)</label>
            <input
              type="number"
              step={0.5}
              value={formData.gapAdjustX}
              onChange={(e) => setFormData({ ...formData, gapAdjustX: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>

          <div>
            <label className="font-semibold text-neutral-700 block mb-1">Vertical Gap Adjust (mm)</label>
            <input
              type="number"
              step={0.5}
              value={formData.gapAdjustY}
              onChange={(e) => setFormData({ ...formData, gapAdjustY: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-[#E5E5E5] text-sm focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            Reset to Zero
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Apply Calibration
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
