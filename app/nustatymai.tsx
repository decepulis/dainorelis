import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import Header from '@/lib/components/Header';
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

  const onLanguageChange = useCallback(
    (language: 'en' | 'lt') => {
      setLanguage(language);
      i18n.changeLanguage(language);
    },
    [setLanguage, i18n]
  );

  const text = useThemeColor('text');

  // I don't want to decide who put the most into this project,
  // so I'm just going to randomize what order the team shows in every time this component mounts
  const [teamInRandomOrder] = useState(() => [...team].sort(() => Math.random() - 0.5));

  return (
    <>
      <Stack.Screen
        options={{
          header: () => <Header title={[]} />,
          headerTransparent: true, // I know it's not transparent, but this is what positions the header correctly
        }}
      />
      <ScrollViewWithHeader>
        <View style={[styles.container]}>
          <View style={[styles.section, styles.settings]}>
            <View style={styles.setting}>
              <ThemedText bold style={[styles.header, { borderColor: text }]}>
                {t('settings')}
              </ThemedText>
              <ThemedText>{t('language')}</ThemedText>
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
              <ThemedText>{t('theme')}</ThemedText>
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
          <View style={styles.section}>
            <ThemedText bold style={[styles.header, { borderColor: text }]}>
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
            <ThemedText bold style={[styles.header, { borderColor: text }]}>
              {t('settingsSpecialThanksTitle')}
            </ThemedText>
            <ThemedText style={[styles.paragraph, { marginBottom: 10 }]}>
              {t('settingsSpecialThanksSimtmecioDainorelis')}
            </ThemedText>
            <ThemedText style={[styles.paragraph]}>{t('settingsSpecialThanksXIDainuSvente')}</ThemedText>
          </View>
          <View style={styles.section}>
            <ThemedText style={[styles.header, { borderColor: text }]} bold>
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
    paddingHorizontal: 30,
    paddingVertical: 40,
    position: 'relative',
  },
  section: {
    marginBottom: 50,
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
  },
  settings: {
    gap: 20,
  },
  setting: {
    gap: 5,
  },
  header: {
    fontSize: 25,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 15,
    paddingBottom: 5,
  },
  subheader: {
    fontSize: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
  profiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    maxWidth: 450,
    marginHorizontal: 'auto',
  },
  profile: { alignItems: 'center', margin: 10 },
  profileImage: { width: 120, height: 120, borderRadius: 9999 },
  profileText: { width: 130, paddingTop: 10, textAlign: 'center' },
});
