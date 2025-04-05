import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Image } from 'expo-image';
import { Link, Stack, router } from 'expo-router';

import { FontAwesome6 } from '@expo/vector-icons';

import SegmentedControl from '@/lib/components/SegmentedControl';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import { fonts } from '@/lib/constants/themes';
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
  const cardDark = useThemeColor('cardDark');

  const onLanguageChange = useCallback(
    (v: string) => {
      const language = v === 'English' ? 'en' : 'lt';
      setLanguage(language);
      i18n.changeLanguage(language);
    },
    [setLanguage, i18n]
  );

  const isPresented = router.canGoBack();
  const text = useThemeColor('text');
  const showCloseButton = Platform.OS === 'ios' && isPresented;
  return (
    <>
      <Stack.Screen
        options={{
          title: t('about'),
          headerRight: () =>
            !showCloseButton ? null : (
              <Link asChild href="../">
                <Pressable hitSlop={24}>
                  <FontAwesome6 name="xmark" size={18} color={'#fff'} />
                </Pressable>
              </Link>
            ),
        }}
      />
      <ScrollView style={[styles.container, { paddingBottom: inset.bottom }]}>
        <View style={styles.section}>
          <SegmentedControl
            values={['Lietuvių', 'English']}
            selectedIndex={language === 'en' ? 1 : 0}
            onValueChange={onLanguageChange}
          />
        </View>
        <View style={styles.section}>
          <ThemedText style={[styles.header, { borderColor: text }]}>{t('aboutWriteToUsTitle')}</ThemedText>
          <ThemedText style={styles.paragraph}>
            {t('aboutWriteToUsText') + ' '}
            <Link href="mailto:info@dainorelisapp.com" asChild>
              <ThemedText style={{ textDecorationLine: 'underline' }}>info@dainorelisapp.com</ThemedText>
            </Link>
          </ThemedText>
        </View>
        <View style={styles.section}>
          <ThemedText style={[styles.header, { borderColor: text }]}>{t('aboutOurGoalTitle')}</ThemedText>
          <ThemedText style={styles.paragraph}>{t('aboutOurGoalText')}</ThemedText>
        </View>
        <View style={[styles.section]}>
          <ThemedText style={[styles.header, { borderColor: text }]}>{t('aboutOurTeamTitle')}</ThemedText>
          <View style={styles.profiles}>
            {team.map((member, idx) => (
              <View key={idx} style={styles.profile}>
                <Image source={member.image} style={[styles.profileImage, { backgroundColor: cardDark }]} />
                <ThemedText style={styles.profileText}>
                  {member.firstName} {member.lastName}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
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
    ...fonts.bold,
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
