import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import type { MenuAction, NativeActionEvent } from '@expo/ui/community/menu';
import FontAwesome6 from '@react-native-vector-icons/fontawesome6/static';

import { HeaderBackground, HeaderLeft, ModalToolbar } from '@/lib/components/Header';
import MenuView from '@/lib/components/MenuView';
import ScrollViewWithHeader from '@/lib/components/ScrollViewWithHeader';
import Switch from '@/lib/components/Switch';
import ThemedText from '@/lib/components/ThemedText';
import padding from '@/lib/constants/padding';
import useContentColumnStyle from '@/lib/hooks/useContentColumnStyle';
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
  const { value: showChords, setValue: setShowChords } = useStorage('showChords');
  const contentColumn = useContentColumnStyle();
  const openFeedback = useOpenFeedback();

  const primary = useThemeColor('primary');
  const card = useThemeColor('card');
  const separator = useThemeColor('separator');

  // the privacy policy and the photo credit open in the in-app browser
  const openLink = (url: string) =>
    WebBrowser.openBrowserAsync(url, {
      controlsColor: primary,
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      dismissButtonStyle: 'close',
    });
  const linkStyle = { textDecorationLine: 'underline', textDecorationColor: primary } as const;

  const onLanguageChange = (language: 'en' | 'lt') => {
    setLanguage(language);
    i18n.changeLanguage(language);
  };

  const text = useThemeColor('text');

  // Language menu actions
  const languageActions: MenuAction[] = [
    { id: 'lt', title: 'Lietuvių', state: language === 'lt' ? 'on' : 'off' },
    { id: 'en', title: 'English', state: language === 'en' ? 'on' : 'off' },
  ];

  const handleLanguageChange = (e: NativeActionEvent) => {
    const { event } = e.nativeEvent;
    onLanguageChange(event as 'en' | 'lt');
  };

  // Theme menu actions
  const themeActions: MenuAction[] = [
    { id: 'auto', title: t('autoTheme'), state: theme === 'auto' ? 'on' : 'off' },
    { id: 'dark', title: t('darkTheme'), state: theme === 'dark' ? 'on' : 'off' },
    { id: 'light', title: t('lightTheme'), state: theme === 'light' ? 'on' : 'off' },
  ];

  const handleThemeChange = (e: NativeActionEvent) => {
    const { event } = e.nativeEvent;
    setTheme(event as 'auto' | 'dark' | 'light');
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: (props) => <HeaderLeft {...props} modal />,
          headerBackground: () => <HeaderBackground />,
        }}
      />
      <ModalToolbar />
      <ScrollViewWithHeader>
        <View style={[styles.container, contentColumn]}>
          <View style={[styles.section]}>
            <ThemedText title bold style={[styles.header, { borderColor: separator }]}>
              {t('settingsTitle')}
            </ThemedText>
            <View style={styles.settings}>
              <View style={styles.hSetting}>
                <ThemedText style={[styles.settingTitle]}>{t('language')}</ThemedText>
                <MenuView actions={languageActions} onPressAction={handleLanguageChange}>
                  <View style={styles.pickerTrigger}>
                    <ThemedText style={styles.pickerValue}>{language === 'lt' ? 'Lietuvių' : 'English'}</ThemedText>
                    <FontAwesome6 name="chevron-down" iconStyle="solid" size={12} color={text} />
                  </View>
                </MenuView>
              </View>
              <View style={styles.hSetting}>
                <ThemedText style={[styles.settingTitle]}>{t('theme')}</ThemedText>
                <MenuView actions={themeActions} onPressAction={handleThemeChange}>
                  <View style={styles.pickerTrigger}>
                    <ThemedText style={styles.pickerValue}>
                      {theme === 'auto' ? t('autoTheme') : theme === 'dark' ? t('darkTheme') : t('lightTheme')}
                    </ThemedText>
                    <FontAwesome6 name="chevron-down" iconStyle="solid" size={12} color={text} />
                  </View>
                </MenuView>
              </View>
              <View style={styles.hSetting}>
                <ThemedText style={[styles.settingTitle]}>{t('showChords')}</ThemedText>
                <Switch value={showChords} onValueChange={setShowChords} accessibilityLabel={t('showChords')} />
              </View>
            </View>
          </View>
          <View style={styles.section}>
            <ThemedText title bold style={[styles.header, { borderColor: separator }]}>
              {t('settingsWriteToUsTitle')}
            </ThemedText>
            <Pressable
              onPress={() => openFeedback()}
              hitSlop={{ top: padding / 2, bottom: padding / 2, left: padding, right: padding }}
            >
              {({ pressed }) => (
                <>
                  <ThemedText style={[styles.paragraph, { marginBottom: padding }]}>
                    {t('settingsWriteToUsText1')}{' '}
                    <ThemedText
                      style={[{ textDecorationLine: pressed ? undefined : 'underline', textDecorationColor: primary }]}
                    >
                      {t('settingsWriteToUsText2')}
                    </ThemedText>
                  </ThemedText>
                  <ThemedText style={[styles.paragraph]}>{t('settingsWriteToUsText3')}</ThemedText>
                </>
              )}
            </Pressable>
          </View>
          <View style={styles.section}>
            <ThemedText title bold style={[styles.header, { borderColor: separator }]}>
              {t('settingsSpecialThanksTitle')}
            </ThemedText>
            <ThemedText style={[styles.paragraph, { marginBottom: padding }]}>
              {t('settingsSpecialThanksSimtmecioDainorelis')}
            </ThemedText>
            <ThemedText style={[styles.paragraph]}>{t('settingsSpecialThanksXIDainuSvente')}</ThemedText>
          </View>
          <View style={styles.section}>
            <ThemedText title bold style={[styles.header, { borderColor: separator }]}>
              {t('settingsAboutUsTitle')}
            </ThemedText>
            <ThemedText title bold style={[styles.subheader]}>
              {t('settingsOurGoalTitle')}
            </ThemedText>
            <ThemedText style={styles.paragraph}>{t('settingsOurGoalText')}</ThemedText>
            <ThemedText title bold style={[styles.subheader, { marginTop: padding }]}>
              {t('settingsOurTeamTitle')}
            </ThemedText>
            <View style={styles.profiles}>
              {team.map((member, idx) => (
                <View key={idx} style={styles.profile}>
                  <Image source={member.image} style={[styles.profileImage, { backgroundColor: card }]} />
                  <ThemedText style={styles.paragraph}>
                    {member.firstName} {member.lastName}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
          {/* the footer, under the same hairline as the section headers */}
          <View style={[styles.footer, { borderColor: separator }]}>
            <Pressable
              onPress={() => openLink('https://dainorelis.app/privacy')}
              accessibilityRole="link"
              hitSlop={{ top: padding / 2, bottom: padding / 2, left: padding, right: padding }}
            >
              {({ pressed }) => (
                <ThemedText
                  style={[
                    styles.paragraph,
                    { textDecorationLine: pressed ? undefined : 'underline', textDecorationColor: primary },
                  ]}
                >
                  {t('privacyPolicy')}
                </ThemedText>
              )}
            </Pressable>
            {/* the home screen's forest photo */}
            <ThemedText style={[styles.paragraph, { marginTop: padding }]}>
              {t('photoCredit')}{' '}
              <ThemedText
                style={linkStyle}
                accessibilityRole="link"
                onPress={() =>
                  openLink(
                    'https://unsplash.com/@sebastian_unrau?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText'
                  )
                }
              >
                Sebastian Unrau
              </ThemedText>
              ,{' '}
              <ThemedText
                style={linkStyle}
                accessibilityRole="link"
                onPress={() =>
                  openLink(
                    'https://unsplash.com/photos/trees-on-forest-with-sun-rays-sp-p7uuT0tw?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText'
                  )
                }
              >
                Unsplash
              </ThemedText>
            </ThemedText>
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
  },
  section: {
    marginBottom: padding * 1.5,
  },
  settings: {
    gap: padding,
  },
  hSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: padding,
  },
  settingTitle: {
    fontSize: 16,
    flexGrow: 0,
    flexShrink: 0,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: padding / 4,
    flexShrink: 1,
  },
  pickerValue: {
    fontSize: 16,
  },
  header: {
    fontSize: 26,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: padding,
    paddingBottom: padding / 2,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: padding,
  },
  subheader: {
    fontSize: 19,
    marginBottom: padding,
  },
  paragraph: {
    fontSize: 17,
    lineHeight: 17 * 1.33,
  },
  profiles: { gap: padding / 2 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: padding / 2 },
  profileImage: { width: padding * 2, height: padding * 2, borderRadius: 9999 },
});
