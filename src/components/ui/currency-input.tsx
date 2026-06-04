"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { maskCurrencyBRL, cn } from "@/lib/utils";

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange" | "type"> {
  value: string;
  onValueChange: (formatted: string) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, placeholder = "R$ 0,00", ...props }, ref) => (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      value={value}
      onChange={(e) => onValueChange(maskCurrencyBRL(e.target.value))}
      placeholder={placeholder}
      className={cn(className)}
      {...props}
    />
  )
);
CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
