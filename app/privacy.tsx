import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Stack } from 'expo-router';

import Markdown from '@/lib/components/Markdown';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import ThemedText from '@/lib/components/ThemedText';
import padding from '@/lib/constants/padding';
import useContentColumnStyle from '@/lib/hooks/useContentColumnStyle';
import privacy from '@/privacy.json';

// Markdown renders the subset lyrics use (bold, italics, links), so headings and list bullets are drawn here
const blocks = privacy.markdown
  .split(/\n{2,}/)
  .map((block) => block.trim())
  .filter((block) => block && block !== '---');

// https://dainorelis.app/privacy, the URL the stores list; English only, like PRIVACY.md (privacy.json, generated)
export default function Page() {
  const inset = useSafeAreaInsets();
  const contentColumn = useContentColumnStyle();
  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy' }} />
      <ScrollViewWithHeader>
        <View
          style={[
            contentColumn,
            { paddingTop: padding, paddingBottom: Math.max(inset.bottom + padding * 2, padding * 4) },
          ]}
        >
          {blocks.map((block, i) => {
            const heading = block.match(/^(#+) (.*)/);
            return heading ? (
              <ThemedText key={i} bold role="heading" style={heading[1].length === 1 ? styles.title : styles.heading}>
                {heading[2]}
              </ThemedText>
            ) : (
              <Markdown key={i}>{block.replace(/^- /gm, '•  ')}</Markdown>
            );
          })}
        </View>
      </ScrollViewWithHeader>
    </>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, marginBottom: padding },
  heading: { fontSize: 22, marginTop: padding, marginBottom: padding / 2 },
});
