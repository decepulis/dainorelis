import { initReactI18next } from 'react-i18next';

import i18n, { LanguageDetectorModule } from 'i18next';

import { storage } from '../hooks/useStorage';

const getLanguageFromStorage: LanguageDetectorModule = {
  type: 'languageDetector',
  init: () => {},
  detect: function () {
    let language = 'lt'; // default to lithuanian
    const languageJSON = storage.getString('language');
    if (languageJSON) {
      try {
        const languageParsed = JSON.parse(languageJSON);
        if (languageParsed === 'en') language = 'en';
      } catch (e) {
        console.error('Error parsing language from MMKV:', e);
      }
    }

    return language;
  },
};

const en = {
  songs: 'Songs',
  allSongs: 'All Songs',
  favoriteSongs: 'Favorites',
  favoriteSong: 'Favorite',
  noResults: 'No results.',
  noHits: 'Check the spelling or try a new search.',
  noFavorites1: 'No favorites. When viewing a song, press',
  noFavorites2: 'to set a favorite',
  settingsTitle: 'Settings',
  settingsSpecialThanksTitle: 'Special thanks',
  settingsSpecialThanksSimtmecioDainorelis:
    'Benita Mincevičiūtė ir Ieva Brogienė and the Skautijos Šimtmečio Dainorėlis team',
  settingsSpecialThanksXIDainuSvente: 'The XI Dainų Šventė team',
  settingsWriteToUsTitle: 'Write to us',
  settingsWriteToUsText: 'If you have any questions or suggestions, or just want to say hello, write to us at',
  settingsAboutUsTitle: 'About us',
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
  musicAndWordsBy: 'Music and words by ',
  variantsMenuTitle: 'Versions',
  variant: 'Version',
  lyrics: 'Lyrics',
  sheetMusic: 'Sheet music',
  mediaMenuTitle: 'Recordings',
  media: 'Recording',
  feedback: 'Feedback',
  aboutSong: 'About this song',
  shareSong: 'Share',
  feedbackUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSdNf7wjGeafKFHlHOG6doyrb_sWHTDif0TXW7qxiuWTbkhfHg/viewform?usp=pp_url&entry.1630106308=',
  songFestival: '2025 Lithuanian Song Festival',
  songFestivalRepertoire0: 'National Anthems & Prayer',
  songFestivalRepertoire1: 'Part I: We were born Lithuanian',
  songFestivalRepertoire2: 'Part II: The place of my dreams',
  songFestivalRepertoire3: 'Part III: And the sun rose, again awakening the world',
  songFestivalRepertoire4: "Part IV: Let's open the hope chest of song & dance",
};
const lt = {
  songs: 'Dainos',
  allSongs: 'Visos',
  favoriteSongs: 'Mėgstamos',
  noResults: 'Rezultatų nėra.',
  noHits: 'Patikrinkite rašybą arba pabandykite naują paiešką.',
  noFavorites1: 'Žiūrėdami dainą, spauskite',
  noFavorites2: 'mygtuką ir pažymekit kaip „mėgstama“',
  settingsTitle: 'Nustatymai',
  settingsSpecialThanksTitle: 'Nuoširdi padėka',
  settingsSpecialThanksSimtmecioDainorelis:
    'Benita Mincevičiūtei ir Ieva Brogienei bei Skautijos Šimtmečio Dainorėlio komandai',
  settingsSpecialThanksXIDainuSvente: 'XI Dainų Šventės komandai',
  settingsWriteToUsTitle: 'Parašykite mums',
  settingsWriteToUsText: 'Turite klausimų, pasiūlymų ar tiesiog norite pasveikinti? Rašykite mums el. paštu',
  settingsAboutUsTitle: 'Apie mus',
  settingsOurGoalTitle: 'Mūsų tikslas',
  settingsOurGoalText:
    'Mes sukūrėme „Dainorėlis App“, kad lietuviai po visą pasaulį galėtų lengvai rasti savo mylimų liaudės dainų tekstus. Tikimės, kad šis rinkinys Jus įkvėps uždainuoti bet kur ir bet kada!',
  settingsOurTeamTitle: 'Mūsų komanda',
  language: 'Kalba',
  theme: 'Režimas',
  autoTheme: 'Auto',
  darkTheme: 'Tamsus',
  lightTheme: 'Šviesus',
  showChords: 'Rodyti akordus',
  hideChords: 'Nerodyti akordų',
  musicBy: 'Muzika: ',
  wordsBy: 'Žodžiai: ',
  musicAndWordsBy: 'Muzika ir žodžiai: ',
  variantsMenuTitle: 'Variantai',
  variant: 'Variantas',
  lyrics: 'Žodžiai',
  sheetMusic: 'Natos',
  mediaMenuTitle: 'Įrašai',
  media: 'Įrašas',
  feedback: 'Palikti atsiliepimą',
  favoriteSong: 'Mėgstama',
  aboutSong: 'Rodyti aprašymą',
  shareSong: 'Bendrinti dainą',
  feedbackUrl:
    'https://docs.google.com/forms/d/e/1FAIpQLSdfp7P-qYInjfLFxHQyw8uW-PHmGh43HyzXfo34rVwPft4noA/viewform?usp=pp_url&entry.1630106308=',
  songFestival: '2025 Dainų Šventė',
  songFestivalRepertoire0: 'Himnai ir malda',
  songFestivalRepertoire1: 'Pirma dalis: Lietuviais esame mes gimę',
  songFestivalRepertoire2: 'Antra dalis: Ten mano svajos...',
  songFestivalRepertoire3: 'Trečia dalis: Jau saulelė vėl atkopdama budino svietą',
  songFestivalRepertoire4: 'Ketvirta dalis: Atverkime šokio ir dainos skrynelę',
};

export async function initI18n() {
  await i18n
    .use(initReactI18next)
    .use(getLanguageFromStorage)
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
