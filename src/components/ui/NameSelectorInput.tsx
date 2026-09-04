import React, { useState, useEffect, useRef, useMemo } from 'react';
import { recordNamesService, RecordedNameOption } from '../../services/records/recordNamesService';
import { User, Check, ChevronDown, Plus, X, History } from 'lucide-react';

export interface NameSelectorInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  category: 'solicitor' | 'buyer';
  raffleId?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  autoFocus?: boolean;
  error?: string;
  className?: string;
  showPills?: boolean;
}

export const NameSelectorInput: React.FC<NameSelectorInputProps> = ({
  label,
  value,
  onChange,
  category,
  raffleId,
  placeholder,
  helperText,
  required = false,
  autoFocus = false,
  error,
  className = '',
  showPills = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [records, setRecords] = useState<RecordedNameOption[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load records on mount or category/raffle change
  useEffect(() => {
    if (category === 'solicitor') {
      setRecords(recordNamesService.getRecordedSolicitors(raffleId));
    } else {
      setRecords(recordNamesService.getRecordedBuyers(raffleId));
    }
  }, [category, raffleId]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRecords = useMemo(() => {
    const query = (value || '').trim().toLowerCase();
    if (!query) return records;
    return records.filter((r) => r.name.toLowerCase().includes(query));
  }, [records, value]);

  const hasExactMatch = useMemo(() => {
    const query = (value || '').trim().toLowerCase();
    return records.some((r) => r.name.toLowerCase() === query);
  }, [records, value]);

  const handleSelect = (name: string) => {
    onChange(name);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const categoryTitle = category === 'solicitor' ? 'Solicitor' : 'Buyer';
  const defaultPlaceholder = placeholder || (category === 'solicitor' ? 'Select or type solicitor name...' : 'Select or type buyer name...');

  return (
    <div ref={containerRef} className={`w-full relative ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-600">
            {label}
          </label>
          {records.length > 0 && (
            <span className="text-[11px] text-[#F97316] font-medium flex items-center gap-1">
              <History className="w-3 h-3" />
              {records.length} saved {category}s
            </span>
          )}
        </div>
      )}

      {/* Input container */}
      <div className="relative flex items-center">
        <div className="absolute left-3 text-neutral-400 pointer-events-none">
          <User className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={defaultPlaceholder}
          required={required}
          autoFocus={autoFocus}
          className={`w-full rounded-lg border bg-white pl-9 pr-16 py-2 text-sm text-[#111111] placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:border-transparent transition-all ${
            error ? 'border-red-500 focus:ring-red-500' : 'border-[#E5E5E5]'
          }`}
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
              title="Clear"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-1 text-neutral-400 hover:text-neutral-600 rounded transition-colors"
            title="Toggle previous records list"
          >
            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#F97316]' : ''}`} />
          </button>
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>}
      {!error && helperText && <p className="mt-1 text-xs text-[#6B7280]">{helperText}</p>}

      {/* Quick-pick Recent Pills */}
      {showPills && records.length > 0 && !value && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
            Quick pick:
          </span>
          {records.slice(0, 4).map((r) => (
            <button
              key={r.name}
              type="button"
              onClick={() => handleSelect(r.name)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-neutral-100 hover:bg-orange-50 hover:text-[#F97316] hover:border-orange-200 border border-neutral-200 rounded-full text-neutral-700 transition-colors"
            >
              <span>{r.name}</span>
              <span className="text-[10px] text-neutral-400">({r.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Floating Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E5E5E5] rounded-xl shadow-xl overflow-hidden max-h-56 flex flex-col animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2 bg-neutral-50 border-b border-[#E5E5E5] flex items-center justify-between text-[11px] font-semibold text-neutral-500">
            <span>Previous {categoryTitle} Records</span>
            <span>{filteredRecords.length} found</span>
          </div>

          <div className="overflow-y-auto divide-y divide-neutral-100">
            {filteredRecords.length > 0 ? (
              filteredRecords.map((r) => {
                const isSelected = value.trim().toLowerCase() === r.name.toLowerCase();
                return (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => handleSelect(r.name)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors hover:bg-orange-50 ${
                      isSelected ? 'bg-orange-50/80 font-bold text-[#F97316]' : 'text-neutral-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        isSelected ? 'bg-[#F97316] text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900 leading-tight">{r.name}</p>
                        <p className="text-[10px] text-neutral-400">
                          {r.count} previous record{r.count === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>

                    {isSelected ? (
                      <Check className="w-4 h-4 text-[#F97316]" />
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500 font-mono">
                        Select
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-neutral-500">
                {records.length === 0 ? (
                  <p>No previous {category} records found. Type to enter a new name.</p>
                ) : (
                  <p>No matching {category}s for "{value}".</p>
                )}
              </div>
            )}

            {/* Option to add new name if typed and not in exact match */}
            {value.trim() && !hasExactMatch && (
              <button
                type="button"
                onClick={() => {
                  onChange(value.trim());
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs bg-orange-50/50 hover:bg-orange-100/70 text-[#F97316] font-semibold border-t border-orange-100 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Use new {category}: "<strong>{value.trim()}</strong>"</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
