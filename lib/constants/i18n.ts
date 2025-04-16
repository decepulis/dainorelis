import { initReactI18next } from 'react-i18next';

import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LanguageDetectorAsyncModule } from 'i18next';

const getLanguageFromAsyncStorage: LanguageDetectorAsyncModule = {
  type: 'languageDetector',
  async: true,
  init: () => {},
  detect: async function () {
    let language = 'lt';
    const languageJSON = await AsyncStorage.getItem('language');
    if (languageJSON) {
      const langaugeJSONParsed = JSON.parse(languageJSON);
      if (langaugeJSONParsed === 'en') language = 'en';
    }

    return Promise.resolve(language);
  },
};

const en = {
  songs: 'Songs',
  allSongs: 'All Songs',
  favoriteSongs: 'Favorites',
  addToFavorites: 'Add favorite',
  removeFromFavorites: 'Remove favorite',
  noHits: 'No results. Check the spelling or try a new search.',
  noFavorites1: 'No favorites. When viewing a song, press',
  noFavorites2: 'to set a favorite',
  settings: 'Settings',
  settingsWriteToUsTitle: 'Write to us',
  settingsWriteToUsText: 'If you have any questions or suggestions, or just want to say hello, write to us at',
  settingsOurGoalTitle: 'Our goal',
  settingsOurGoalText:
    'We created the "Dainorėlis App" so that Lithuanians around the world could easily find the lyrics of their favorite folk songs. We hope this collection will inspire you to sing anywhere and any time!',
  settingsOurTeamTitle: 'Our team',
  language: 'Language',
  theme: 'Theme',
  autoTheme: 'Auto',
  darkTheme: 'Dark',
  lightTheme: 'Light',
  showChords: 'Show chords',
  hideChords: 'Hide chords',
  musicBy: 'Music by ',
  wordsBy: 'Words by ',
  variantsMenuTitle: 'Versions',
  variant: 'Version',
  mediaMenuTitle: 'Recordings',
  media: 'Recording',
};
const lt = {
  songs: 'Dainos',
  allSongs: 'Visos',
  favoriteSongs: 'Mano',
  addToFavorites: 'Pažymėti „mano“',
  removeFromFavorites: 'Pašalinti „mano“',
  noHits: 'Rezultatų nėra. Patikrinkite rašybą arba pabandykita atlikti naują paiešką.',
  noFavorites1: 'Žiūrėdami dainą, spauskite',
  noFavorites2: 'pažymėti kaip „mano“',
  settings: 'Nustatymai',
  settingsWriteToUsTitle: 'Parašykite mums',
  settingsWriteToUsText: 'Turite klausimų, pasiūlymų ar tiesiog norite pasveikinti? Rašykite mums el. paštu',
  settingsOurGoalTitle: 'Mūsų tikslas',
  settingsOurGoalText:
    'Mes sukūrėme „Dainorėlis App“, kad lietuviai po visą pasaulį galėtų lengvai rasti savo mylimų liaudės dainų tekstus. Tikimės, kad šis rinkinys Jus įkvėps uždainuoti bet kur ir bet kada!',
  settingsOurTeamTitle: 'Mūsų komanda',
  language: 'Kalba',
  theme: 'Tema',
  autoTheme: 'Auto',
  darkTheme: 'Tamsi',
  lightTheme: 'Šviesi',
  showChords: 'Rodyti akordus',
  hideChords: 'Nerodyti akordų',
  musicBy: 'Muzika: ',
  wordsBy: 'Žodžiai: ',
  variantsMenuTitle: 'Variantai',
  variant: 'Variantas',
  mediaMenuTitle: 'Įrašai',
  media: 'Įrašas',
};

export async function initI18n() {
  await i18n
    .use(initReactI18next)
    .use(getLanguageFromAsyncStorage)
    .init({
      resources: {
        en: { translation: en },
        lt: { translation: lt },
      },
      fallbackLng: 'lt',
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      react: {
        useSuspense: false,
      },
    });
}
export default i18n;
