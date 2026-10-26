// Bundles PRIVACY.md, the policy's one source, as JSON for app/privacy.tsx (Metro can't import markdown).
// `build:web` runs it, so the website always renders the current file.
import { readFileSync, writeFileSync } from 'node:fs';

writeFileSync('privacy.json', JSON.stringify({ markdown: readFileSync('PRIVACY.md', 'utf8') }) + '\n');
