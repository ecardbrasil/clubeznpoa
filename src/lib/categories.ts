export const DEFAULT_CATEGORIES = [
  "Supermercado",
  "Farmácia",
  "Restaurante",
  "Padaria",
  "Cafeteria",
  "Pet",
  "Beleza",
  "Saúde",
  "Educação",
  "Serviços",
  "Moda",
  "Casa e decoração",
];

export function parseCategories(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return raw ? [raw] : [];
  }
}

export function serializeCategories(items: string[]): string {
  return JSON.stringify(items);
}
