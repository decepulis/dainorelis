import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import ThemedText from '../ThemedText';

export const NoHits = () => {
  const { t } = useTranslation();
  return <ThemedText style={styles.text}>{t('noHits')}</ThemedText>;
};

export const EmptyPlaylist = ({ isSearch }: { isSearch?: boolean }) => {
  const { t } = useTranslation();
  return <ThemedText style={styles.text}>{isSearch ? t('noHitsInPlaylist') : t('emptyPlaylist')}</ThemedText>;
};

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    lineHeight: 18 * 1.33,
    opacity: 0.8,
  },
});
