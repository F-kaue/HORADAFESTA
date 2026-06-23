export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function matchesSearch(
  query: string,
  ...fields: (string | null | undefined)[]
): boolean {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;
  return fields.some(
    (field) => field && normalizeSearchText(field).includes(normalizedQuery)
  );
}
