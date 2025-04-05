import { ComponentPropsWithoutRef, Dispatch, SetStateAction, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import maxWidth from '../constants/maxWidth';
import { fonts } from '../constants/themes';
import useStorage from '../hooks/useStorage';
import { useThemeColor } from '../hooks/useThemeColor';
import { Lyrics as LyricsType } from '../schemas/lyrics';
import { PDFs } from '../schemas/pdfs';
import { Song } from '../schemas/songs';
import isLyrics from '../utils/isLyrics';
import Markdown from './Markdown';
import ThemedText from './ThemedText';

type Props = {
  song: Song;
  title: string[];
  activeVariant: LyricsType | PDFs;
  isTitleBehind: boolean;
  setIsTitleBehind: Dispatch<SetStateAction<boolean>>;
};
export default function Lyrics({ song, title, activeVariant, setIsTitleBehind }: Props) {
  const { t } = useTranslation();
  const { value: showChords } = useStorage('showChords');
  const text = useThemeColor('text');

  const titleRef = useRef<View>(null);

  const scrollHandler: ComponentPropsWithoutRef<typeof ScrollView>['onScroll'] = (event) => {
    const titleEl = titleRef.current;
    if (titleEl) {
      titleEl.measure((_x, _y, _width, titleHeight, _pageX, _pageY) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        const target = titleHeight;
        if (scrollY < target) setIsTitleBehind(false);
        else setIsTitleBehind(true);
      });
    }
  };

  const hasAttribution = !!song.fields['Music Author'] || !!song.fields['Text Author'];

  // TODO padding on scroll view makes android unhappy
  return (
    <ScrollView
      style={styles.scroll}
      contentInsetAdjustmentBehavior="automatic"
      onScroll={scrollHandler}
      scrollEventThrottle={100}
    >
      <View style={styles.container}>
        <View style={styles.titleContainer} ref={titleRef}>
          {title.map((part, index) => (
            <ThemedText key={index} style={[styles.title, index === 0 ? styles.mainTitle : styles.subtitle]}>
              {part}
            </ThemedText>
          ))}
        </View>
        {isLyrics(activeVariant) ? (
          <Markdown showLinksAsChords showChords={showChords}>
            {activeVariant['Lyrics & Chords']}
          </Markdown>
        ) : null}
        {hasAttribution ? <View style={[styles.hr, { backgroundColor: text }]} /> : null}
        {song.fields['Music Author'] ? (
          <ThemedText>
            {t('musicBy')}
            {song.fields['Music Author']}
          </ThemedText>
        ) : null}
        {song.fields['Text Author'] ? (
          <ThemedText>
            {t('wordsBy')}
            {song.fields['Text Author']}
          </ThemedText>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 80,
  },
  titleContainer: {
    // padding is included in the title measurement
    paddingTop: 40,
    // margin isn't
    marginBottom: 20,
  },
  title: {},
  mainTitle: {
    ...fonts.bold,
    fontSize: 30,
  },
  subtitle: {
    fontSize: 18,
  },
  hr: {
    height: StyleSheet.hairlineWidth,
    marginTop: 40,
    marginBottom: 40,
  },
});
