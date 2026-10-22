import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  Host,
  Text,
  TextButton,
  TextField,
  type TextFieldRef,
  useNativeState,
} from '@expo/ui/jetpack-compose';

import { playlistNameMaxLength } from '@/lib/constants/playlistName';

import { useColorScheme } from './useColorScheme';
import type { NamePromptOptions } from './useNamePrompt';
import { useThemeColor } from './useThemeColor';

export type { NamePromptOptions } from './useNamePrompt';

/**
 * Asks for a playlist name in a Material dialog with a text field (Android has no Alert.prompt). Render
 * `namePrompt` anywhere on the screen; the dialog presents in its own window.
 */
export default function useNamePrompt() {
  const [options, setOptions] = useState<(NamePromptOptions & { key: number }) | null>(null);

  const promptName = (next: NamePromptOptions) => setOptions({ ...next, key: Date.now() });

  const namePrompt = options ? <NameDialog {...options} key={options.key} onClose={() => setOptions(null)} /> : null;

  return { promptName, namePrompt };
}

function NameDialog({
  title,
  defaultValue = '',
  confirmLabel,
  onSubmit,
  onClose,
}: NamePromptOptions & { onClose: () => void }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const primary = useThemeColor('primary');
  // the field owns its text natively; this mirrors it for the confirm button
  const value = useNativeState(defaultValue);
  // the caret after a name being renamed, as on iOS
  const selection = useNativeState({ start: defaultValue.length, end: defaultValue.length });
  const [text, setText] = useState(defaultValue);
  const name = text.trim();

  // the keyboard outlives the dialog's window unless the field lets go of it first
  const fieldRef = useRef<TextFieldRef>(null);
  const close = () => {
    fieldRef.current?.blur();
    onClose();
  };
  const submit = () => {
    if (!name) return;
    close();
    onSubmit(name);
  };

  return (
    <Host colorScheme={colorScheme} style={{ position: 'absolute', width: 1, height: 1 }}>
      <AlertDialog onDismissRequest={close}>
        <AlertDialog.Title>
          <Text style={{ typography: 'headlineSmall' }}>{title}</Text>
        </AlertDialog.Title>
        <AlertDialog.Text>
          <TextField
            ref={fieldRef}
            value={value}
            selection={selection}
            onValueChange={setText}
            autoFocus
            singleLine
            maxLength={playlistNameMaxLength}
            keyboardOptions={{ capitalization: 'sentences', imeAction: 'done' }}
            keyboardActions={{ onDone: submit }}
            colors={{ focusedIndicatorColor: primary, focusedLabelColor: primary, cursorColor: primary }}
          >
            <TextField.Label>
              <Text>{t('playlistName')}</Text>
            </TextField.Label>
          </TextField>
        </AlertDialog.Text>
        <AlertDialog.ConfirmButton>
          <TextButton enabled={!!name} onClick={submit} colors={{ contentColor: primary }}>
            <Text>{confirmLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
        <AlertDialog.DismissButton>
          <TextButton onClick={close} colors={{ contentColor: primary }}>
            <Text>{t('cancel')}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
      </AlertDialog>
    </Host>
  );
}
