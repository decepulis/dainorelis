import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AlertDialog, Host, Text, TextButton, useMaterialColors } from '@expo/ui/jetpack-compose';

import { useColorScheme } from './useColorScheme';
import type { ConfirmOptions } from './useConfirm';
import { useThemeColor } from './useThemeColor';

/**
 * Asks to confirm an action in a Material dialog, like useNamePrompt's, with a destructive confirm button in the
 * error colour. Render `confirmDialog` anywhere on the screen; the dialog presents in its own window.
 */
export default function useConfirm() {
  const [options, setOptions] = useState<(ConfirmOptions & { key: number }) | null>(null);

  const confirm = (next: ConfirmOptions) => setOptions({ ...next, key: Date.now() });

  const confirmDialog = options ? (
    <ConfirmDialog {...options} key={options.key} onClose={() => setOptions(null)} />
  ) : null;

  return { confirm, confirmDialog };
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  destructive,
  onConfirm,
  onClose,
}: ConfirmOptions & { onClose: () => void }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const primary = useThemeColor('primary');
  const { error } = useMaterialColors({ colorScheme });

  return (
    <Host colorScheme={colorScheme} style={{ position: 'absolute', width: 1, height: 1 }}>
      <AlertDialog onDismissRequest={onClose}>
        <AlertDialog.Title>
          <Text style={{ typography: 'headlineSmall' }}>{title}</Text>
        </AlertDialog.Title>
        {message ? (
          <AlertDialog.Text>
            <Text>{message}</Text>
          </AlertDialog.Text>
        ) : null}
        <AlertDialog.ConfirmButton>
          <TextButton
            onClick={() => {
              onClose();
              onConfirm();
            }}
            colors={{ contentColor: destructive ? error : primary }}
          >
            <Text>{confirmLabel}</Text>
          </TextButton>
        </AlertDialog.ConfirmButton>
        <AlertDialog.DismissButton>
          <TextButton onClick={onClose} colors={{ contentColor: primary }}>
            <Text>{t('cancel')}</Text>
          </TextButton>
        </AlertDialog.DismissButton>
      </AlertDialog>
    </Host>
  );
}
