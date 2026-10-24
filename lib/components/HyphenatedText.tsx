import { useState } from 'react';
import { type TextLayoutEvent, useWindowDimensions } from 'react-native';

import useAccessibilityInfo from '../hooks/useAccessibilityInfo';
import hyphenate from '../utils/hyphenate';
import ThemedText from './ThemedText';

type Props = Omit<React.ComponentProps<typeof ThemedText>, 'children'> & { children: string };

// the words found too long for a line, per text, window width and text size: rows remount as the list scrolls
const cache = new Map<string, string[]>();

/**
 * ThemedText whose words too long for a line (the largest accessibility sizes) break with a hyphen at a
 * Lithuanian hyphenation point instead of at any letter. Only those words get soft hyphens, found from the plain
 * layout's mid-word breaks, so a word that fits on the next line still moves there whole.
 */
export default function HyphenatedText({ children, ...props }: Props) {
  const { width, fontScale } = useWindowDimensions();
  const { isBoldTextEnabled } = useAccessibilityInfo();
  const key = `${width} ${fontScale} ${isBoldTextEnabled} ${children}`;
  const [found, setFound] = useState<{ key: string; words: string[] }>();
  const words = found?.key === key ? found.words : (cache.get(key) ?? []);

  const onTextLayout = (e: TextLayoutEvent) => {
    const lines = e.nativeEvent.lines.map((line) => line.text);
    const text = lines.join('');
    let end = 0;
    const broken = lines
      .slice(0, -1)
      .map((line) => {
        end += line.length;
        // a line ending in a letter, not a space or a hyphen, broke mid-word (which may span more lines)
        if (/[\s\u00AD-]$/.test(line)) return null;
        return `${text.slice(0, end).match(/\S*$/)![0]}${text.slice(end).match(/^\S*/)![0]}`.replaceAll('\u00AD', '');
      })
      .filter((word): word is string => !!word && !words.includes(word));
    if (!broken.length) return;
    const next = [...new Set([...words, ...broken])];
    cache.set(key, next);
    setFound({ key, words: next });
  };

  return (
    <ThemedText
      {...props}
      onTextLayout={onTextLayout}
      // Android ignores soft hyphens without it, and hyphenates on its own with it, so only where they're needed
      android_hyphenationFrequency={words.length ? 'normal' : undefined}
      // read as the plain words
      accessibilityLabel={words.length ? children : undefined}
    >
      {words.length
        ? children
            .split(/(\s+)/)
            .map((word) => (words.includes(word) ? hyphenate(word) : word))
            .join('')
        : children}
    </ThemedText>
  );
}
