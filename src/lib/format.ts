export function money(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value || 0);
}

export function percent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

export function asHours(value: number): string {
  return `${value.toFixed(1)}h`;
}

export function byName<T extends { nome: string }>(a: T, b: T): number {
  return a.nome.localeCompare(b.nome, "pt-BR");
}
