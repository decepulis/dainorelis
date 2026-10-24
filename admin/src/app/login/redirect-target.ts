/**
 * Only ever redirect within this app. A leading `//` or `/\` is
 * protocol-relative to a browser (`//evil.com`), so `startsWith('/')` alone is
 * not enough. Browsers also strip tabs and newlines before parsing, so the
 * value is resolved the same way and must stay on the placeholder origin.
 */
export function redirectTarget(next: string | null | undefined): string {
  if (!next || !/^\/(?![/\\])/.test(next)) return '/';

  const origin = 'http://admin.invalid';
  try {
    return new URL(next, origin).origin === origin ? next : '/';
  } catch {
    return '/';
  }
}
