import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { Link, Stack, router } from 'expo-router';

import SegmentedControl from '@/lib/components/SegmentedControl';
import ThemedText from '@/lib/components/ThemedText';
import maxWidth from '@/lib/constants/maxWidth';
import { fonts } from '@/lib/constants/themes';
import useStorage from '@/lib/hooks/useStorage';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

export default function Page() {
  const { t, i18n } = useTranslation();
  const { value: language, setValue: setLanguage } = useStorage('language');

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
          headerRight: () =>
            !showCloseButton ? null : (
              <Link asChild href="../">
                <Pressable hitSlop={24}>
                  <ThemedText style={{ color: '#fff', fontSize: 24 }}>×</ThemedText>
                </Pressable>
              </Link>
            ),
        }}
      />
      <ScrollView style={styles.container} contentInsetAdjustmentBehavior="automatic">
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
            <View style={styles.profile}>
              <Image source={require('@/assets/images/profiles/dar.jpg')} style={styles.profileImage} />
              <ThemedText style={styles.profileText}>Darius Čepulis</ThemedText>
            </View>
            <View style={styles.profile}>
              <Image source={require('@/assets/images/profiles/jonas.jpg')} style={styles.profileImage} />
              <ThemedText style={styles.profileText}>Jonas Čyvas</ThemedText>
            </View>
            <View style={styles.profile}>
              <Image source={require('@/assets/images/profiles/shar.jpg')} style={styles.profileImage} />
              <ThemedText style={styles.profileText}>Šarūnas Daugirdas</ThemedText>
            </View>
            <View style={styles.profile}>
              <Image source={require('@/assets/images/profiles/kes.jpg')} style={styles.profileImage} />
              <ThemedText style={styles.profileText}>Kęstutis Daugirdas</ThemedText>
            </View>
            <View style={styles.profile}>
              <Image source={require('@/assets/images/profiles/daina.jpg')} style={styles.profileImage} />
              <ThemedText style={styles.profileText}>Daina Bandžiulytė</ThemedText>
            </View>
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
