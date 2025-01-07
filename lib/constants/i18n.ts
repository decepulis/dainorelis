import { initReactI18next } from 'react-i18next';

import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from 'i18next';

const getLanguagePreferences = async () => {
  const language = await AsyncStorage.getItem('language');
  return language || 'lt';
};

const en = {
  songs: 'Songs',
  allSongs: 'All',
  favoriteSongs: 'Favorites',
  noHits: 'No search results',
  noFavorites1: 'When viewing a song, press the',
  noFavorites2: 'icon to set a favorite',
  aboutUs: 'About us',
  aboutWriteToUsTitle: 'Write to us',
  aboutWriteToUsText: 'If you have any questions or suggestions, or just want to say hello, write to us at',
  aboutOurGoalTitle: 'Our goal',
  aboutOurGoalText:
    'We created the "Dainorėlis App" so that Lithuanians around the world could easily find the lyrics of their favorite folk songs. We hope this collection will inspire you to sing anywhere and any time!',
  aboutOurTeamTitle: 'Our team',
};
const lt = {
  songs: 'Dainos',
  allSongs: 'Visos',
  favoriteSongs: 'Mano',
  noHits: 'Nerasta',
  noFavorites1: 'Peržiūrėdami dainą, paspauskite',
  noFavorites2: 'pažymėti kaip „mano“',
  aboutUs: 'Apie mus',
  aboutWriteToUsTitle: 'Parašykite mums',
  aboutWriteToUsText: 'Turite klausimų, pasiūlymų ar tiesiog norite pasveikinti? Rašykite mums el. paštu',
  aboutOurGoalTitle: 'Mūsų tikslas',
  aboutOurGoalText:
    'Mes sukūrėme „Dainorėlis App“, kad lietuviai po visą pasaulį galėtų lengvai rasti savo mylimų liaudės dainų tekstus. Tikimės, kad šis rinkinys Jus įkvėps uždainuoti bet kur ir bet kada!',
  aboutOurTeamTitle: 'Mūsų komanda',
};

// Initialize i18n
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    lt: { translation: lt },
  },
  lng: await getLanguagePreferences(),
  fallbackLng: 'lt',
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

export default i18n;
