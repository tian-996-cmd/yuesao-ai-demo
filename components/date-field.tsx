'use client';

import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { zhCN } from 'date-fns/locale';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  formatChineseDate,
  isoDateToLocalDate,
  localDateToIso,
} from '@/lib/date';
import { cn } from '@/lib/utils';

export function DateField({
  id,
  value,
  onChange,
  placeholder = '请选择日期',
  disabled = false,
  required = false,
  className,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = isoDateToLocalDate(value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        disabled={disabled}
        aria-required={required}
        aria-label={value ? formatChineseDate(value) : placeholder}
        className={cn('date-field', !value && 'is-placeholder', className)}
      >
        <span>{value ? formatChineseDate(value) : placeholder}</span>
        <CalendarDays aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="start" className="date-picker-popover">
        <Calendar
          mode="single"
          locale={zhCN}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(localDateToIso(date));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
