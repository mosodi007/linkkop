"use client";

import * as React from "react";
import { Search, ChevronDown } from "lucide-react";

import { cn } from "./utils";
import { Button } from "./button";
import { Input } from "./input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { ScrollArea } from "./scroll-area";
import type { CountryOption } from "@/app/data/countries";
import { getFlagEmoji } from "@/app/data/countries";

export interface CountryCodeSelectProps {
  value: string;
  onChange: (iso2: string) => void;
  options: CountryOption[];
  placeholder?: string;
  className?: string;
  /** Trigger height and style to match adjacent phone input */
  triggerClassName?: string;
}

export function CountryCodeSelect({
  value,
  onChange,
  options,
  placeholder = "Country",
  className,
  triggerClassName,
}: CountryCodeSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");

  const selected = React.useMemo(
    () => options.find((o) => o.value === value),
    [options, value]
  );

  const filtered = React.useMemo(() => {
    if (!search.trim()) return options;
    const q = search.trim().toLowerCase();
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.dialCode.toLowerCase().includes(q) ||
        o.dialCode.replace(/\D/g, "").includes(q.replace(/\D/g, ""))
    );
  }, [options, search]);

  const handleSelect = (opt: CountryOption) => {
    onChange(opt.value);
    setSearch("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-11 rounded-xl border-neutral-200 bg-white px-3 font-normal text-neutral-900 hover:bg-neutral-50 hover:border-neutral-300",
            "inline-flex items-center gap-1.5 shrink-0 [&_svg]:shrink-0",
            triggerClassName,
            className
          )}
          aria-label="Select country"
        >
          {selected ? (
            <>
              <span className="text-base leading-none" aria-hidden>
                {getFlagEmoji(selected.iso2)}
              </span>
              <span className="text-sm font-medium tabular-nums">
                {selected.dialCode}
              </span>
            </>
          ) : (
            <span className="text-sm text-neutral-500">{placeholder}</span>
          )}
          <ChevronDown className="h-4 w-4 text-neutral-500" />
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-[min(100vw-2rem,400px)] p-0 gap-0 rounded-2xl border-neutral-200 shadow-xl bg-white"
        onPointerDownOutside={(e) => setSearch("")}
        onInteractOutside={(e) => setSearch("")}
      >
        <DialogTitle className="sr-only">Select country</DialogTitle>
        <div className="p-4 pb-0 pr-12">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <Input
              type="search"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 rounded-xl border-neutral-200 bg-neutral-50 focus-visible:ring-neutral-300"
              autoFocus
              aria-label="Search countries"
            />
          </div>
        </div>
        <ScrollArea className="h-[min(60vh,320px)] px-2">
          <div className="pb-4 pt-2 space-y-0.5">
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">
                No countries match your search.
              </p>
            ) : (
              filtered.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors",
                    "hover:bg-neutral-100 focus:outline-none focus:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-neutral-300 focus-visible:ring-offset-2",
                    value === opt.value && "bg-neutral-100 font-medium"
                  )}
                >
                  <span className="text-lg leading-none shrink-0" aria-hidden>
                    {getFlagEmoji(opt.iso2)}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-neutral-900">
                    {opt.label.replace(` (${opt.dialCode})`, "")}
                  </span>
                  <span className="text-neutral-500 tabular-nums shrink-0">
                    {opt.dialCode}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
