'use client';

import { type ComponentProps, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

/**
 * A submit button that disables itself while its form's action runs, so a
 * double click can't create two songs or delete one twice. For forms whose
 * action isn't wrapped in `useActionState`, which reports `pending` itself.
 */
export default function SubmitButton({
  pendingLabel,
  children,
  disabled,
  ...props
}: Omit<ComponentProps<'button'>, 'type'> & { pendingLabel?: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </button>
  );
}
