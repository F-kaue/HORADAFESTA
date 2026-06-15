"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface GuestCountFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function GuestCountField({
  value,
  onChange,
  min = 20,
  max = 999,
}: GuestCountFieldProps) {
  const handleInput = (raw: string) => {
    if (raw === "") return;
    const n = parseInt(raw, 10);
    if (!Number.isNaN(n)) onChange(clamp(n, min, max));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label className="text-base font-semibold">Convidados estimados</Label>
          <p className="font-display text-2xl font-bold text-primary">
            ~{value} pessoas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="guest-count-exact" className="text-xs text-muted-foreground">
            Número exato
          </Label>
          <Input
            id="guest-count-exact"
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            step={1}
            value={value}
            onChange={(e) => handleInput(e.target.value)}
            className="w-24 text-center font-semibold tabular-nums"
            aria-label="Número exato de convidados"
          />
        </div>
      </div>
      <Slider
        min={min}
        max={Math.min(max, 500)}
        step={1}
        value={[Math.min(value, 500)]}
        onValueChange={([v]) => onChange(v)}
      />
      <div className="flex justify-between text-xs font-semibold text-muted-foreground">
        <span>{min}</span>
        <span className="font-normal">Arraste ou digite — ex.: 53, 69, 127</span>
        <span>{max}+</span>
      </div>
    </div>
  );
}
