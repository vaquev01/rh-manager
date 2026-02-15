export const TODAY = "2026-02-14";

export function nowIso(): string {
  return new Date().toISOString();
}

export function daysBetween(aIsoDate: string, bIsoDate: string): number {
  const a = new Date(aIsoDate);
  const b = new Date(bIsoDate);
  const diff = b.getTime() - a.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function monthKeyFromDate(dateIso: string): string {
  return dateIso.slice(0, 7);
}

export function asDateLabel(dateIso: string): string {
  const [year, month, day] = dateIso.split("-");
  return `${day}/${month}/${year}`;
}
