import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { ValidationWarning } from '../../types/designer';

interface ValidationWarningsProps {
  warnings: ValidationWarning[];
}

export const ValidationWarnings: React.FC<ValidationWarningsProps> = ({ warnings }) => {
  if (warnings.length === 0) {
    return (
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Design is valid and ready for print generation.</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {warnings.map((warn) => (
        <div
          key={warn.id}
          className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs font-medium ${
            warn.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          {warn.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>{warn.message}</div>
        </div>
      ))}
    </div>
  );
};
