import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

export type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel: string;
  /** the confirm button does something that can't be undone: red */
  destructive?: boolean;
  onConfirm: () => void;
};

/**
 * Asks to confirm an action: UIKit's alert on iOS, the browser's confirm on web. Android's RN Alert doesn't match
 * the Compose name dialog (or colour a destructive button), so useConfirm.android.tsx shows a Compose dialog,
 * rendered by `confirmDialog`.
 */
export default function useConfirm() {
  const { t } = useTranslation();

  const confirm = ({ title, message, confirmLabel, destructive, onConfirm }: ConfirmOptions) => {
    // react-native-web's Alert does nothing
    if (process.env.EXPO_OS === 'web') {
      if (window.confirm(message ? `${title}\n${message}` : title)) onConfirm();
      return;
    }
    Alert.alert(title, message, [
      { text: t('cancel'), style: 'cancel' },
      { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
    ]);
  };

  return { confirm, confirmDialog: null as React.ReactNode };
}
