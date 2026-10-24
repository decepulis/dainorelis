import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * The only auth emails this app sends: invitations, sent from the Supabase
 * dashboard, and password resets. Sign-ups are disabled, so a `signup`,
 * `magiclink` or `email_change` link has no business landing here.
 */
const LINK_TYPES = ['invite', 'recovery'] as const satisfies readonly EmailOtpType[];

export type EmailLinkType = (typeof LINK_TYPES)[number];

export function isEmailLinkType(value: unknown): value is EmailLinkType {
  return (LINK_TYPES as readonly unknown[]).includes(value);
}

/** Both link types leave the editor signed in with no password they know yet. */
export const SET_PASSWORD_PATH = '/account/password';

export const LINK_ERROR = 'That link is invalid or has expired.';
