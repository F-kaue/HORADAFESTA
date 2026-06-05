import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Ex: 5000 → "R$ 5.000,00" para campo de entrada */
export function formatCurrencyInput(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  return formatCurrency(value);
}

/** Máscara em tempo real: só dígitos → centavos → R$ brasileiro */
export function maskCurrencyBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const cents = parseInt(digits, 10);
  return formatCurrency(cents / 100);
}

/** "R$ 5.000,00" → 5000 */
export function parseCurrencyBRL(formatted: string): number {
  const digits = formatted.replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return "—";
  const parsed =
    typeof date === "string"
      ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date)
      : date;
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(parsed);
}

export function formatWhatsApp(phone: string) {
  return phone.replace(/\D/g, "");
}

export function maskWhatsApp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : "";
  if (digits.length <= 7)
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "agora mesmo";
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}
