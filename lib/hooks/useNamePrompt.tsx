import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

export type NamePromptOptions = {
  title: string;
  message?: string;
  defaultValue?: string;
  confirmLabel: string;
  /** called with the trimmed name; never with a blank one */
  onSubmit: (name: string) => void;
};

/**
 * Asks for a playlist name: UIKit's alert with a text field on iOS (Alert.prompt), the browser's prompt on web.
 * Android has no Alert.prompt, so useNamePrompt.android.tsx shows a Compose dialog, rendered by `namePrompt`.
 */
export default function useNamePrompt() {
  const { t } = useTranslation();

  const promptName = ({ title, message, defaultValue, confirmLabel, onSubmit }: NamePromptOptions) => {
    const submit = (value?: string | null) => {
      const name = value?.trim();
      if (name) onSubmit(name);
    };
    if (process.env.EXPO_OS === 'ios') {
      Alert.prompt(
        title,
        message,
        [
          { text: t('cancel'), style: 'cancel' },
          { text: confirmLabel, isPreferred: true, onPress: submit },
        ],
        'plain-text',
        defaultValue
      );
    } else {
      submit(window.prompt(title, defaultValue));
    }
  };

  return { promptName, namePrompt: null as React.ReactNode };
}
