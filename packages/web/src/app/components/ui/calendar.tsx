"use client";

/**
 * Low-level Calendar (react-day-picker). For a responsive single-date picker
 * with Month/Year dropdowns, use DatePicker from ./date-picker instead.
 */
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-4", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-6",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-0 pb-3 relative items-center w-full",
        caption_label: "text-sm font-semibold text-neutral-900",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "inline-flex items-center justify-center size-9 rounded-full border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 hover:border-neutral-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2"
        ),
        nav_button_previous: "absolute left-0",
        nav_button_next: "absolute right-0",
        table: "w-full border-collapse",
        head_row: "flex justify-between mb-2",
        head_cell:
          "text-neutral-500 text-xs font-medium uppercase tracking-wider w-9 text-center",
        row: "flex w-full mt-1.5 gap-0",
        cell: "relative p-0.5 text-center [&:has([aria-selected])]:bg-transparent",
        day: cn(
          "inline-flex items-center justify-center size-9 rounded-xl text-sm font-medium text-neutral-900",
          "hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2",
          "aria-selected:opacity-100 transition-colors"
        ),
        day_range_start: "rounded-l-xl",
        day_range_end: "rounded-r-xl",
        day_selected:
          "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white focus:bg-neutral-900 focus:text-white",
        day_today: "ring-2 ring-neutral-300 ring-offset-2 bg-white",
        day_outside:
          "text-neutral-300 aria-selected:text-neutral-300 aria-selected:bg-neutral-100",
        day_disabled: "text-neutral-300 opacity-50 cursor-not-allowed hover:bg-transparent",
        day_range_middle:
          "rounded-none bg-neutral-100 text-neutral-900",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4 shrink-0", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4 shrink-0", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
