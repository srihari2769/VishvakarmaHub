'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import clsx from 'clsx';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={clsx(
            'w-full px-4 py-2.5 bg-input border rounded-xl text-foreground text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue/50 appearance-none cursor-pointer',
            error ? 'border-danger focus:border-danger' : 'border-border focus:border-blue',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" className="text-muted">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
