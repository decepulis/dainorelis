import { ComponentPropsWithoutRef, Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MarkdownLib, { MarkdownIt } from 'react-native-markdown-display';

import { fonts } from '@/lib/constants/themes';

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

const lineHeight = 28;
const chordHeight = 16;

const styles = StyleSheet.create({
  text: {
    fontSize: 20,
    lineHeight: lineHeight,
  },
  strong: {
    fontFamily: fonts.bold.fontFamily,
    fontWeight: fonts.bold.fontWeight,
  },
  em: {
    // todo not working on android
    fontFamily: fonts.regularItalic.fontFamily,
    fontStyle: 'italic',
  },
  strongEm: {
    fontFamily: fonts.boldItalic.fontFamily,
    fontWeight: fonts.bold.fontWeight,
    fontStyle: 'italic',
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
    text: (node) => {
      return (
        <Text key={node.key} style={styles.text}>
          {node.content}
        </Text>
      );
    },
    strong: (node, children, parent) => {
      const parentTypes = parent.map((p) => p.sourceType);
      const strongAndEm = parentTypes.includes('em');
      return (
        <Text key={node.key} style={[styles.text, strongAndEm ? styles.strongEm : styles.strong]}>
          {children}
        </Text>
      );
    },
    em: (node, children, parent) => {
      const parentTypes = parent.map((p) => p.sourceType);
      const strongAndEm = parentTypes.includes('strong');
      return (
        <Text key={node.key} style={[styles.text, strongAndEm ? styles.strongEm : styles.em]}>
          {children}
        </Text>
      );
    },
    link: (node, children) => {
      const { href } = node.attributes;
      if (!showChords) return children;
      if (href) {
        return (
          <Fragment key={node.key}>
            <View style={{ height: lineHeight + chordHeight, width: 0 }}>
              <Text
                style={{
                  fontSize: chordHeight,
                  width: chordHeight,
                  lineHeight: chordHeight * 1.5,
                  fontFamily: fonts.bold.fontFamily,
                  fontWeight: fonts.bold.fontWeight,
                }}
              >
                {href}
              </Text>
            </View>
            {children}
          </Fragment>
        );
      } else {
        return <Text key={node.key}>{children}</Text>;
      }
    },
  };

  return (
    <MarkdownLib markdownit={markdownItInstance} rules={rules}>
      {children}
    </MarkdownLib>
  );
}
