import createHyphenator, { type HyphenationFunctionSync } from 'hyphen';
import patterns from 'hyphen/patterns/lt';

// synchronous without `async: true`
const hyphenateSync = createHyphenator(patterns) as HyphenationFunctionSync;
const cache = new Map<string, string>();

/**
 * Soft hyphens (U+00AD) at a title's Lithuanian hyphenation points: invisible unless a word is too long for its
 * line, where it breaks with a hyphen instead of at any letter. Display only: search, links and stored text keep
 * the plain title. Android honours them only with `android_hyphenationFrequency` set.
 */
export default function hyphenate(text: string) {
  let hyphenated = cache.get(text);
  if (hyphenated === undefined) {
    hyphenated = hyphenateSync(text);
    cache.set(text, hyphenated);
  }
  return hyphenated;
}
