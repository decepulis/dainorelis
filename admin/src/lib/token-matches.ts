/**
 * Constant-time compare so a shared secret can't be probed a byte at a time.
 * Only the length leaks, and the secrets are fixed-length hex anyway.
 */
export function tokenMatches(provided: string, expected: string): boolean {
  if (provided.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < provided.length; i += 1) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}
