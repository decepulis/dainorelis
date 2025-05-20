import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PixelRatio, Pressable, StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { Stack } from 'expo-router';

import { HeaderBackground, HeaderLeft } from '@/lib/components/Header';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SegmentedControl from '@/lib/components/SegmentedControl';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import padding from '@/lib/constants/padding';
import useMaxWidthPadding from '@/lib/hooks/useMaxWidthPadding';
import useOpenFeedback from '@/lib/hooks/useOpenFeedback';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

const team = [
  {
    firstName: 'Darius',
    lastName: 'Čepulis',
    image: require('@/assets/images/profiles/dar.jpg'),
  },
  {
    firstName: 'Jonas',
    lastName: 'Čyvas',
    image: require('@/assets/images/profiles/jonas.jpg'),
  },
  {
    firstName: 'Šarūnas',
    lastName: 'Daugirdas',
    image: require('@/assets/images/profiles/shar.jpg'),
  },
  {
    firstName: 'Kęstutis',
    lastName: 'Daugirdas',
    image: require('@/assets/images/profiles/kes.jpg'),
  },
  {
    firstName: 'Daina',
    lastName: 'Bandžiulytė',
    image: require('@/assets/images/profiles/daina.jpg'),
  },
];

export default function Page() {
  const { t, i18n } = useTranslation();
  const { value: language, setValue: setLanguage } = useStorage('language');
  const { value: theme, setValue: setTheme } = useStorage('theme');
  const maxWidthPadding = useMaxWidthPadding();
  const openFeedback = useOpenFeedback();

  const primary = useThemeColor('primary');
  const card = useThemeColor('card');
  const separator = useThemeColor('separator');

  const onLanguageChange = useCallback(
    (language: 'en' | 'lt') => {
      setLanguage(language);
      i18n.changeLanguage(language);
    },
    [setLanguage, i18n]
  );
  const [isWriteToUsPressed, setIsWriteToUsPressed] = useState(false);

  // I don't want to decide who put the most into this project,
  // so I'm just going to randomize what order the team shows in every time this component mounts
  const [teamInRandomOrder] = useState(() => [...team].sort(() => Math.random() - 0.5));

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: (props) => <HeaderLeft {...props} modal />,
          headerBackground: () => <HeaderBackground opaque />,
        }}
      />
      <ScrollViewWithHeader>
        <View style={[styles.container, maxWidthPadding]}>
          <View style={[styles.section]}>
            <ThemedText bold style={[styles.header, { borderColor: separator }]}>
              {t('settingsTitle')}
            </ThemedText>
            <View style={styles.settings}>
              <View style={styles.setting}>
                <ThemedText style={[styles.settingTitle, { flexBasis: 70 * PixelRatio.getFontScale() }]}>
                  {t('language')}
                </ThemedText>
                <SegmentedControl
                  options={[
                    { label: 'Lietuvių', value: 'lt' },
                    { label: 'English', value: 'en' },
                  ]}
                  value={language}
                  onValueChange={(l: string) => onLanguageChange(l as 'en' | 'lt')}
                />
              </View>
              <View style={styles.setting}>
                <ThemedText style={[styles.settingTitle, { flexBasis: 65 * PixelRatio.getFontScale() }]}>
                  {t('theme')}
                </ThemedText>
                <SegmentedControl
                  options={[
                    { label: t('autoTheme'), value: 'auto' },
                    { label: t('darkTheme'), value: 'dark' },
                    { label: t('lightTheme'), value: 'light' },
                  ]}
                  value={theme}
                  onValueChange={(t: string) => setTheme(t as 'auto' | 'dark' | 'light')}
                />
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <ThemedText bold style={[styles.header, { borderColor: separator }]}>
              {t('settingsWriteToUsTitle')}
            </ThemedText>
            <Pressable
              onPressIn={() => setIsWriteToUsPressed(true)}
              onPressOut={() => setIsWriteToUsPressed(false)}
              onPress={() => openFeedback()}
              hitSlop={{ top: padding / 2, bottom: padding / 2, left: padding, right: padding }}
            >
              <ThemedText style={[styles.paragraph, { marginBottom: padding / 2 }]}>
                {t('settingsWriteToUsText1')}{' '}
                <ThemedText
                  style={[
                    { textDecorationLine: isWriteToUsPressed ? undefined : 'underline', textDecorationColor: primary },
                  ]}
                >
                  {t('settingsWriteToUsText2')}
                </ThemedText>
              </ThemedText>
            </Pressable>
          </View>
          <View style={styles.section}>
            <ThemedText bold style={[styles.header, { borderColor: separator }]}>
              {t('settingsSpecialThanksTitle')}
            </ThemedText>
            <ThemedText style={[styles.paragraph, { marginBottom: 10 }]}>
              {t('settingsSpecialThanksSimtmecioDainorelis')}
            </ThemedText>
            <ThemedText style={[styles.paragraph]}>{t('settingsSpecialThanksXIDainuSvente')}</ThemedText>
          </View>
          <View style={styles.section}>
            <ThemedText style={[styles.header, { borderColor: separator }]} bold>
              {t('settingsAboutUsTitle')}
            </ThemedText>
            <ThemedText style={[styles.subheader, { marginTop: 10 }]} italic bold>
              {t('settingsOurGoalTitle')}
            </ThemedText>
            <ThemedText style={styles.paragraph}>{t('settingsOurGoalText')}</ThemedText>
            <ThemedText style={styles.subheader} italic bold>
              {t('settingsOurTeamTitle')}
            </ThemedText>
            <View style={styles.profiles}>
              {teamInRandomOrder.map((member, idx) => (
                <View key={idx} style={styles.profile}>
                  <Image source={member.image} style={[styles.profileImage, { backgroundColor: card }]} />
                  <ThemedText style={styles.paragraph}>
                    {member.firstName} {member.lastName}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollViewWithHeader>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: padding * 2,
    position: 'relative',
    width: '100%',
    maxWidth: maxWidth,
    marginHorizontal: 'auto',
  },
  section: {
    marginBottom: padding * 1.5,
  },
  settings: {
    gap: padding / 2,
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding,
  },
  settingTitle: {
    fontSize: 14,
    flexGrow: 0,
    flexShrink: 0,
  },
  header: {
    fontSize: 23,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: padding / 2,
    paddingBottom: padding / 4,
  },
  subheader: {
    fontSize: padding,
    marginTop: padding,
    marginBottom: padding / 2,
    fontSize: 19,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 17 * 1.33,
  },
  profiles: { gap: padding / 2 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: padding / 2 },
  profileImage: { width: padding * 2, height: padding * 2, borderRadius: 9999 },
});
