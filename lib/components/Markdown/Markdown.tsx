import { ComponentPropsWithoutRef, Fragment } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MarkdownLib, { MarkdownIt } from 'react-native-markdown-display';

import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';

import ThemedText from '../ThemedText';

const markdownItInstance = MarkdownIt({ html: false, typographer: true }).disable([
  // to reduce dev load, I'm disabling most components
  // At first, I'm really only anticipating needing bold, italic, and links
  // see https://github.com/markdown-it/markdown-it/blob/master/lib/presets/commonmark.mjs for available rules
  'blockquote',
  'code',
  'fence',
  'heading',
  'hr',
  'html_block',
  'lheading',
  'list',
  'reference',
  // 'paragraph',
  'autolink',
  'backticks',
  'entity',
  // 'escape',
  'html_inline',
  'image',
  // 'link',
  // 'newline',
  // 'text'
]);

const fontSize = 18;
const lineHeight = Platform.OS === 'ios' ? fontSize * 1.33 : fontSize * 1.45;
const chordHeight = 14;

const styles = StyleSheet.create({
  text: {
    fontSize,
    // lineHeight set dynamically down below
  },
});

type Props = {
  children?: string;
  showLinksAsChords?: boolean;
  showChords?: boolean;
};
/**
 * Lyrics are rendered using a controlled subset of markdown
 */
export default function Markdown({ children, showLinksAsChords = false, showChords = false }: Props) {
  const { isHighContrastEnabled } = useAccessibilityInfo();

  // TODO selectable text
  const rules: ComponentPropsWithoutRef<typeof MarkdownLib>['rules'] = {
    paragraph: (node, children, _parent, styles) => (
      <View key={node.key} style={styles._VIEW_SAFE_paragraph}>
        <ThemedText>{children}</ThemedText>
      </View>
    ),
    text: (node, _children, parent) => {
      const parentTypes = parent.map((p) => p.sourceType);
      const strong = parentTypes.includes('strong');
      const em = parentTypes.includes('em');
      // TODO blocker? uh-oh this breaks on multi-line+chords ios
      return (
        <ThemedText
          key={node.key}
          bold={strong}
          italic={em}
          style={[
            styles.text,
            {
              lineHeight: Platform.select({
                default: lineHeight,
                // android doesn't automatically make chord-lines taller, so we just make all lines taller
                android: showChords ? lineHeight + chordHeight : lineHeight,
              }),
            },
          ]}
        >
          {node.content}
        </ThemedText>
      );
    },
    strong: (node, children, parent) => {
      const parentTypes = parent.map((p) => p.sourceType);
      const strongAndEm = parentTypes.includes('em');
      return (
        <ThemedText key={node.key} style={styles.text} bold italic={strongAndEm}>
          {children}
        </ThemedText>
      );
    },
    em: (node, children, parent) => {
      const parentTypes = parent.map((p) => p.sourceType);
      const strongAndEm = parentTypes.includes('strong');
      return (
        <ThemedText key={node.key} style={styles.text} bold={strongAndEm} italic>
          {children}
        </ThemedText>
      );
    },
    link: (node, children) => {
      const { href } = node.attributes;
      // TODO support real links for descriptions
      if (!showChords) return children;
      if (href) {
        return (
          <Fragment key={node.key}>
            {/* insert 0-width element for chord to orient itself against */}
            <View
              style={{
                height: lineHeight + chordHeight,
                width: 0,
                // @ts-expect-error this works for the web
                verticalAlign: 'bottom',
              }}
            >
              <ThemedText
                italic
                style={{
                  opacity: isHighContrastEnabled ? 1 : 0.7,
                  fontSize: chordHeight,
                  // this doesn't matter they'll overlap if they need to
                  width: chordHeight * 4,
                  // just kinda eyeballing it
                  // increasing this number makes chords move closer to the text
                  lineHeight: chordHeight * Platform.select({ ios: 1.9, android: 2.5, default: 1 }),
                }}
              >
                {href}
              </ThemedText>
            </View>
            {children}
          </Fragment>
        );
      } else {
        return <ThemedText key={node.key}>{children}</ThemedText>;
      }
    },
  };

  return (
    <MarkdownLib markdownit={markdownItInstance} rules={rules}>
      {children}
    </MarkdownLib>
  );
}
