export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(1);
}

export function parseJsonArray<T>(json: string | null | undefined): T[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseJsonRecord<K extends string, V>(
  json: string | null | undefined
): Record<K, V> {
  if (!json) return {} as Record<K, V>;
  try {
    const parsed = JSON.parse(json);
    return (typeof parsed === "object" && parsed !== null) ? parsed : {} as Record<K, V>;
  } catch {
    return {} as Record<K, V>;
  }
}
