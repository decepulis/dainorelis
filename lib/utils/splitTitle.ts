export default function splitTitle(title = '') {
  return title
    .split(/(\(.*\))/)
    .map((part) => part.trim())
    .filter(Boolean);
}
