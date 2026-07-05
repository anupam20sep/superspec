import { isValidHttpUrl } from "./url-validator.js";
import { generateCode } from "./code-generator.js";
import { insertIfFree, resolve as resolveInStore } from "./store.js";

export function shorten(longUrl: string): { code: string; url: string } | { error: string } {
  if (!isValidHttpUrl(longUrl)) {
    return { error: "INVALID_URL" };
  }
  let code = generateCode();
  while (!insertIfFree(code, longUrl)) {
    code = generateCode();
  }
  return { code, url: longUrl };
}

export function resolve(code: string): string | undefined {
  return resolveInStore(code);
}
