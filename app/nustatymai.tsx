import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Link, Stack } from 'expo-router';

import Header from '@/lib/components/Header';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import SegmentedControl from '@/lib/components/SegmentedControl';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import useDefaultHeaderHeight from '@/lib/hooks/useDefaultHeaderHeight';
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
team.sort((a, b) => a.lastName.localeCompare(b.lastName));

export default function Page() {
  const { t, i18n } = useTranslation();
  const { value: language, setValue: setLanguage } = useStorage('language');
  const inset = useSafeAreaInsets();
  const defaultHeaderHeight = useDefaultHeaderHeight();
  const card = useThemeColor('card');

  const onLanguageChange = useCallback(
    (language: 'en' | 'lt') => {
      setLanguage(language);
      i18n.changeLanguage(language);
    },
    [setLanguage, i18n]
  );

  const text = useThemeColor('text');

  return (
    <>
      <Stack.Screen
        options={{
          header: () => <Header title={[t('settings')]} />,
          headerTransparent: true, // I know it's not transparent, but this is what positions the header correctly
        }}
      />
      <ScrollViewWithHeader style={[styles.container]}>
        <View style={styles.section}>
          <SegmentedControl
            options={[
              { label: 'Lietuvių', value: 'lt' },
              { label: 'English', value: 'en' },
            ]}
            value={language}
            onValueChange={(l: string) => onLanguageChange(l as 'en' | 'lt')}
          />
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
          <ThemedText style={[styles.header, { borderColor: text }]} bold>
            {t('settingsOurGoalTitle')}
          </ThemedText>
          <ThemedText style={styles.paragraph}>{t('settingsOurGoalText')}</ThemedText>
        </View>
        <View style={[styles.section]}>
          <ThemedText style={[styles.header, { borderColor: text }]} bold>
            {t('settingsOurTeamTitle')}
          </ThemedText>
          <View style={styles.profiles}>
            {team.map((member, idx) => (
              <View key={idx} style={styles.profile}>
                <Image source={member.image} style={[styles.profileImage, { backgroundColor: card }]} />
                <ThemedText style={styles.profileText}>
                  {member.firstName} {member.lastName}
                </ThemedText>
              </View>
            ))}
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
    marginBottom: 40,
    width: '100%',
    maxWidth,
    marginHorizontal: 'auto',
  },
  header: {
    fontSize: 25,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 15,
    paddingBottom: 5,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
  profiles: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  profile: { alignItems: 'center', margin: 10 },
  profileImage: { width: 130, height: 130, borderRadius: 9999 },
  profileText: { paddingTop: 10, textAlign: 'center' },
});
