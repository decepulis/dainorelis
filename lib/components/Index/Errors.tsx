import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { FontAwesome6 } from '@expo/vector-icons';

import ThemedText from '../ThemedText';

export const NoHits = () => {
  const { t } = useTranslation();
  return <ThemedText style={styles.text}>{t('noHits')}</ThemedText>;
};

export const NoFavorites = ({ isSearch }: { isSearch?: boolean }) => {
  const { t } = useTranslation();
  return (
    <ThemedText style={styles.text}>
      {isSearch ? t('noFavorites1Alt') : t('noFavorites1')} <FontAwesome6 name="heart" size={14} /> {t('noFavorites2')}
    </ThemedText>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    lineHeight: 18 * 1.33,
    opacity: 0.8,
  },
});
