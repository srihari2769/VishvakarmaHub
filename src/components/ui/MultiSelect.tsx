'use client';

import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDownIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface MultiSelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
  className?: string;
}

export default function MultiSelect({
  label,
  error,
  options,
  selected,
  onChange,
  placeholder = 'Select categories',
  maxSelections,
  className,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      if (maxSelections && selected.length >= maxSelections) return;
      onChange([...selected, value]);
    }
  };

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const getLabel = (value: string) => {
    return options.find((o) => o.value === value)?.label || value;
  };

  return (
    <div className={clsx('w-full', className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-1.5">
          {label}
        </label>
      )}

      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'w-full min-h-[42px] px-3 py-2 bg-input border rounded-xl text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 flex-wrap',
          isOpen ? 'ring-2 ring-blue/50 border-blue' : '',
          error ? 'border-danger focus:border-danger' : 'border-border',
        )}
      >
        {selected.length === 0 ? (
          <span className="text-muted">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1.5 flex-1">
            {selected.map((val) => (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-blue/15 text-blue text-xs font-medium border border-blue/20"
              >
                {getLabel(val)}
                <button
                  type="button"
                  onClick={(e) => removeOption(val, e)}
                  className="hover:text-blue/70 transition-colors"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
        <ChevronDownIcon
          className={clsx(
            'w-4 h-4 text-muted ml-auto shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="relative z-50">
          <div className="absolute top-1 left-0 right-0 bg-card border border-border rounded-xl shadow-2xl shadow-black/30 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-border">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search categories..."
                  className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-blue/50"
                />
              </div>
              {maxSelections && (
                <p className="text-xs text-muted mt-1.5 px-1">
                  {selected.length}/{maxSelections} selected
                </p>
              )}
              {!maxSelections && selected.length > 0 && (
                <p className="text-xs text-muted mt-1.5 px-1">
                  {selected.length} selected
                </p>
              )}
            </div>

            {/* Options list */}
            <div className="max-h-56 overflow-y-auto scrollbar-thin">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-muted text-center">
                  No categories found
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = selected.includes(opt.value);
                  const isDisabled = !isSelected && maxSelections !== undefined && selected.length >= maxSelections;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => !isDisabled && toggleOption(opt.value)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors',
                        isDisabled
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:bg-blue/5 cursor-pointer',
                        isSelected && 'bg-blue/10'
                      )}
                    >
                      {/* Checkbox */}
                      <div
                        className={clsx(
                          'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                          isSelected
                            ? 'bg-blue border-blue'
                            : 'border-muted'
                        )}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className={clsx('text-foreground', isSelected && 'font-medium')}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {selected.length > 0 && (
              <div className="p-2 border-t border-border flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => { setIsOpen(false); setSearch(''); }}
                  className="text-xs text-blue hover:text-blue/80 font-medium px-3 py-1 rounded-lg bg-blue/10 transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
