import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import { HeaderBackground, HeaderLeft } from '@/lib/components/Header';
import { padding } from '@/lib/components/Index/constants';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SegmentedControl from '@/lib/components/SegmentedControl';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
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

  const card = useThemeColor('card');
  const separator = useThemeColor('separator');

  const onLanguageChange = useCallback(
    (language: 'en' | 'lt') => {
      setLanguage(language);
      i18n.changeLanguage(language);
    },
    [setLanguage, i18n]
  );

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
        <View style={[styles.container]}>
          <View style={[styles.section]}>
            <ThemedText bold style={[styles.header, { borderColor: separator }]}>
              {t('settingsTitle')}
            </ThemedText>
            <View style={styles.settings}>
              <View style={styles.setting}>
                <ThemedText style={styles.settingTitle}>{t('language')}</ThemedText>
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
                <ThemedText style={styles.settingTitle}>{t('theme')}</ThemedText>
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
            <ThemedText style={styles.paragraph}>
              {t('settingsWriteToUsText') + ' '}
              <Link href="mailto:info@dainorelisapp.com" asChild>
                <ThemedText style={{ textDecorationLine: 'underline' }}>info@dainorelisapp.com</ThemedText>
              </Link>
            </ThemedText>
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
                  <ThemedText style={styles.profileText}>
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
    paddingHorizontal: padding,
    paddingVertical: padding * 2,
    position: 'relative',
    width: '100%',
    maxWidth: maxWidth,
    marginHorizontal: 'auto',
  },
  section: {
    marginBottom: padding * 2,
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
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
    // set so that "language" would fit on most screens
    flexBasis: 65,
    flexGrow: 0,
    flexShrink: 0,
  },
  header: {
    fontSize: 24,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: padding / 2,
    paddingBottom: padding / 4,
  },
  subheader: {
    fontSize: padding,
    marginTop: padding,
    marginBottom: padding / 2,
  },
  paragraph: {
    fontSize: 16,
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  profiles: { gap: padding / 2 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: padding / 2 },
  profileImage: { width: padding * 2, height: padding * 2, borderRadius: 9999 },
  profileText: { fontSize: 16, lineHeight: 24 },
});
