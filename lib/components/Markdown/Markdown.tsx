import { ComponentPropsWithoutRef, Fragment } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MarkdownLib, { MarkdownIt } from 'react-native-markdown-display';

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

const lineHeight = 27;
const chordHeight = 16;

const styles = StyleSheet.create({
  text: {
    fontSize: 19,
    // line height set dynamically down below
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
  // todo support real links for descriptions
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
      if (!showChords) return children;
      if (href) {
        return (
          <Fragment key={node.key}>
            <View
              style={{
                height: lineHeight + chordHeight,
                width: 0,
                // @ts-expect-error this works for the web
                verticalAlign: 'bottom',
              }}
            >
              <ThemedText
                bold
                style={{
                  fontSize: chordHeight,
                  width: chordHeight,
                  // just kinda eyeballing it
                  lineHeight: chordHeight * Platform.select({ ios: 1.7, android: 1.8, default: 1 }),
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
