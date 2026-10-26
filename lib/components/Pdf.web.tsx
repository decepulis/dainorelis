import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { PdfProps } from 'react-native-pdf';

import { Link } from 'expo-router';

import padding from '@/lib/constants/padding';
import { useThemeColor } from '@/lib/hooks/useThemeColor';

import ThemedText from './ThemedText';

/**
 * The browser's own PDF viewer, and a link to open the file in a tab of its own (phone browsers don't show PDFs in a
 * page). Download errors don't reach the page, so onError never fires here.
 */
export default function Pdf({ source, style }: PdfProps) {
  const { t } = useTranslation();
  const primary = useThemeColor('primary');
  const uri = typeof source === 'object' && 'uri' in source ? source.uri : undefined;
  return (
    <View style={style}>
      <iframe src={uri} title={t('openSheetMusic')} style={{ border: 0, flex: 1, width: '100%' }} />
      {uri ? (
        <Link href={uri} target="_blank" rel="noopener" style={styles.link}>
          <ThemedText bold style={{ color: primary, textDecorationLine: 'underline' }}>
            {t('openSheetMusic')}
          </ThemedText>
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  link: {
    alignSelf: 'center',
    padding,
  },
});
