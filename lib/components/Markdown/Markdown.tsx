import { ComponentPropsWithoutRef, Fragment } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MarkdownLib, { MarkdownIt } from 'react-native-markdown-display';

import useAccessibilityInfo from '@/lib/hooks/useAccessibilityInfo';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

import ThemedText from '../ThemedText';

const disabledRules = [
  // to reduce dev load, I'm disabling most components
  // At first, I'm really only anticipating needing bold, italic, and links
  // see https://github.com/markdown-it/markdown-it/blob/master/lib/presets/commonmark.mjs for available rules
  'blockquote',
  'code',
  'fence',
  'heading',
  // 'hr', descriptions separate their sources with ---
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
];
const markdownItInstance = MarkdownIt({ html: false, typographer: true }).disable(disabledRules);
// Descriptions also get lists (their glossaries); lyrics don't, since their lines can start with "- "
const proseMarkdownItInstance = MarkdownIt({ html: false, typographer: true }).disable(
  disabledRules.filter((rule) => rule !== 'list')
);

const fontSize = 19;
const lineHeight = process.env.EXPO_OS === 'ios' ? fontSize * 1.45 : fontSize * 1.5;
const chordHeight = 15;

const styles = StyleSheet.create({
  text: {
    fontSize,
    // lineHeight set dynamically down below
  },
  // the library's paragraph style, made here once: static rendering leaves the copy it makes on every render out of
  // some pages' CSS, so their paragraphs jump apart as the page hydrates
  paragraph: {
    marginTop: 10,
    marginBottom: 10,
    flexWrap: 'wrap',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
  },
});

type Props = {
  children?: string;
  showChords?: boolean;
  /** Renders lists, for prose like descriptions */
  prose?: boolean;
};
/**
 * Lyrics are rendered using a controlled subset of markdown
 */
export default function Markdown({ children, showChords = false, prose = false }: Props) {
  const { isHighContrastEnabled } = useAccessibilityInfo();
  const separator = useThemeColor('separator');

  // TODO selectable text
  const rules: ComponentPropsWithoutRef<typeof MarkdownLib>['rules'] = {
    paragraph: (node, children) => (
      <View key={node.key} style={styles.paragraph}>
        <ThemedText>{children}</ThemedText>
      </View>
    ),
    hr: (node) => (
      <View
        key={node.key}
        style={{ height: StyleSheet.hairlineWidth, backgroundColor: separator, marginVertical: fontSize }}
      />
    ),
    bullet_list: (node, children) => <View key={node.key}>{children}</View>,
    ordered_list: (node, children) => <View key={node.key}>{children}</View>,
    list_item: (node, children, parent) => {
      const list = parent.find((p) => p.type === 'bullet_list' || p.type === 'ordered_list');
      const index = list?.children.indexOf(node) ?? 0;
      const marker = list?.type === 'ordered_list' ? `${index + 1}.` : '•';
      return (
        <View key={node.key} style={{ flexDirection: 'row' }}>
          <ThemedText style={[styles.text, { lineHeight, width: fontSize * 1.25 }]}>{marker}</ThemedText>
          <View style={{ flex: 1 }}>{children}</View>
        </View>
      );
    },
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
                  opacity: isHighContrastEnabled ? 1 : 0.65,
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
    <MarkdownLib markdownit={prose ? proseMarkdownItInstance : markdownItInstance} rules={rules}>
      {children}
    </MarkdownLib>
  );
}
