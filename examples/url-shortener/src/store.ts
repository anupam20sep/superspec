interface ShortLink {
  code: string;
  longUrl: string;
  createdAt: string;
}

let links = new Map<string, ShortLink>();

export function insertIfFree(code: string, longUrl: string): boolean {
  if (links.has(code)) return false;
  links.set(code, { code, longUrl, createdAt: new Date().toISOString() });
  return true;
}

export function resolve(code: string): string | undefined {
  return links.get(code)?.longUrl;
}

export function resetStore(): void {
  links = new Map<string, ShortLink>();
}
