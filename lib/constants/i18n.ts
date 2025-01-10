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
  allSongs: 'All',
  favoriteSongs: 'Favorites',
  noHits: 'No search results',
  noFavorites1: 'When viewing a song, press',
  noFavorites2: 'to set a favorite',
  aboutUs: 'About us',
  aboutWriteToUsTitle: 'Write to us',
  aboutWriteToUsText: 'If you have any questions or suggestions, or just want to say hello, write to us at',
  aboutOurGoalTitle: 'Our goal',
  aboutOurGoalText:
    'We created the "Dainorėlis App" so that Lithuanians around the world could easily find the lyrics of their favorite folk songs. We hope this collection will inspire you to sing anywhere and any time!',
  aboutOurTeamTitle: 'Our team',
  showChords: 'Show chords',
  musicBy: 'Music by',
  wordsBy: 'Words by',
};
const lt = {
  songs: 'Dainos',
  allSongs: 'Visos',
  favoriteSongs: 'Mano',
  noHits: 'Nerasta',
  noFavorites1: 'Žiūrėdami dainą, paspauskite',
  noFavorites2: 'pažymėti kaip „mano“',
  aboutUs: 'Apie mus',
  aboutWriteToUsTitle: 'Parašykite mums',
  aboutWriteToUsText: 'Turite klausimų, pasiūlymų ar tiesiog norite pasveikinti? Rašykite mums el. paštu',
  aboutOurGoalTitle: 'Mūsų tikslas',
  aboutOurGoalText:
    'Mes sukūrėme „Dainorėlis App“, kad lietuviai po visą pasaulį galėtų lengvai rasti savo mylimų liaudės dainų tekstus. Tikimės, kad šis rinkinys Jus įkvėps uždainuoti bet kur ir bet kada!',
  aboutOurTeamTitle: 'Mūsų komanda',
  showChords: 'Rodyti akordus',
  musicBy: 'Muzika: ',
  wordsBy: 'Žodžiai: ',
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
