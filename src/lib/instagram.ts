/**
 * Normaliza a entrada do Instagram para guardar apenas o @usuario.
 * Aceita colar o link completo, com ou sem @, e limpa espaços/barra.
 * Retorna null quando vazio.
 */
export function normalizeInstagramHandle(
  input?: string | null
): string | null {
  if (!input) return null;
  let v = input.trim();
  if (!v) return null;
  // Remove a URL completa, se colarem o link do perfil
  v = v.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  // Fica só com a primeira parte (antes de barra, query ou hash)
  v = v.split(/[/?#\s]/)[0];
  // Remove @ do começo
  v = v.replace(/^@+/, "");
  v = v.trim();
  return v || null;
}

/** Monta a URL pública do perfil a partir do @usuario. */
export function instagramProfileUrl(handle?: string | null): string | null {
  const h = normalizeInstagramHandle(handle);
  if (!h) return null;
  return `https://instagram.com/${h}`;
}

/** Formata para exibição sempre com @ na frente. */
export function formatInstagramHandle(handle?: string | null): string | null {
  const h = normalizeInstagramHandle(handle);
  if (!h) return null;
  return `@${h}`;
}
