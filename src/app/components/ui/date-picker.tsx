"use client";

import * as React from "react";
import {
  format,
  setMonth,
  setYear,
  getDaysInMonth,
  startOfMonth,
  endOfMonth,
  getDay,
  addDays,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
} from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "./utils";
import { Button } from "./button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
  fromYear?: number;
  toYear?: number;
  disabled?: (date: Date) => boolean;
  placeholder?: string;
  className?: string;
  /** Trigger element; defaults to a button showing the selected date or placeholder */
  trigger?: React.ReactNode;
  /** Callback when popover opens/closes (e.g. to control external state) */
  onOpenChange?: (open: boolean) => void;
}

function getCalendarDays(month: Date): (Date | null)[] {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const startWeekday = getDay(start); // 0 = Sunday
  const daysInMonth = getDaysInMonth(month);

  const result: (Date | null)[] = [];

  // Leading empty cells
  for (let i = 0; i < startWeekday; i++) {
    result.push(null);
  }

  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    result.push(addDays(start, d - 1));
  }

  // Trailing empty cells to complete the grid (6 rows × 7 = 42)
  const totalCells = 42;
  const filled = result.length;
  for (let i = filled; i < totalCells; i++) {
    result.push(null);
  }

  return result;
}

export function DatePicker({
  value,
  onChange,
  fromYear = 1900,
  toYear = new Date().getFullYear(),
  disabled,
  placeholder = "Pick a date",
  className,
  trigger,
  onOpenChange,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState<Date>(() => value ?? new Date());

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
    if (!next && value) setViewMonth(value);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = Number(e.target.value);
    setViewMonth((m) => setMonth(m, month));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = Number(e.target.value);
    setViewMonth((m) => setYear(m, year));
  };

  const handleDayClick = (day: Date) => {
    if (disabled?.(day)) return;
    onChange?.(day);
    setOpen(false);
  };

  const days = React.useMemo(() => getCalendarDays(viewMonth), [viewMonth]);

  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let y = toYear; y >= fromYear; y--) list.push(y);
    return list;
  }, [fromYear, toYear]);

  const triggerButton = trigger ?? (
    <Button
      type="button"
      variant="outline"
      className={cn(
        "w-full justify-start text-left font-normal h-11 rounded-xl",
        "bg-white border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300",
        !value && "text-neutral-500",
        className
      )}
    >
      <CalendarIcon className="mr-2 h-4 w-4 text-neutral-500 shrink-0" />
      {value ? format(value, "PPP") : placeholder}
    </Button>
  );

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 rounded-2xl border-neutral-200 shadow-lg bg-white min-w-[320px]"
        align="start"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-4 sm:p-5 w-full min-w-[304px] max-w-[min(100vw-2rem,400px)]">
          {/* Month & Year row */}
          <div className="flex items-center gap-2 w-full mb-3">
            <select
              aria-label="Month"
              value={viewMonth.getMonth()}
              onChange={handleMonthChange}
              className={cn(
                "flex-1 min-w-0 h-9 rounded-lg border border-neutral-200 bg-white px-2 text-sm text-neutral-900",
                "focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-300"
              )}
            >
              {MONTHS.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
            <select
              aria-label="Year"
              value={viewMonth.getFullYear()}
              onChange={handleYearChange}
              className={cn(
                "flex-1 min-w-0 h-9 rounded-lg border border-neutral-200 bg-white px-2 text-sm text-neutral-900",
                "focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:border-neutral-300"
              )}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] sm:text-xs font-medium text-neutral-500 uppercase tracking-wider py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }
              const isSelected = value != null && isSameDay(day, value);
              const isCurrentMonth = isSameMonth(day, viewMonth);
              const isDisabled = disabled?.(day) ?? false;
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.getTime()}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "aspect-square min-w-0 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 focus:z-10",
                    isCurrentMonth
                      ? "text-neutral-900 hover:bg-neutral-100"
                      : "text-neutral-300",
                    isSelected &&
                      "bg-neutral-900 text-white hover:bg-neutral-800 focus:ring-neutral-600",
                    isTodayDate && !isSelected && "ring-2 ring-neutral-300 ring-offset-2 bg-white",
                    isDisabled && "text-neutral-300 opacity-50 cursor-not-allowed hover:bg-transparent"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
