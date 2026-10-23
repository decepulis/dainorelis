import { useEffect } from 'react';

import * as AppIntents from 'expo-app-intents';
import { useRouter } from 'expo-router';

import songs from '@/songs';

/**
 * iOS App Intents (modules/app-intents): publishes the songs for Siri, Shortcuts and Spotlight to
 * search, and opens the song an intent asks for. Spotlight results open through the same intent.
 * Renders nothing; a no-op on Android and web.
 */
export default function AppIntentsHandler() {
  const router = useRouter();

  // Swift reads this catalog to resolve and search songs while JS isn't running; publishing an
  // unchanged one does nothing, so every launch is fine. It changes only with a new songs.ts.
  useEffect(() => {
    if (!AppIntents.isAvailable()) return;
    AppIntents.setEntityCatalogAsync(
      'song',
      songs.map((song) => ({
        id: song.id,
        title: song.fields.Name,
        // the English title, so English Siri and searches find it too
        synonyms: Object.values(song.fields.Translations)
          .map((translation) => translation.Title)
          .filter(Boolean),
      }))
    ).catch(console.warn);
  }, []);

  // Invocations wait in a native queue until handled, so one from a cold launch arrives here once
  // the navigator is mounted
  AppIntents.useAppIntents(async (pending) => {
    for (const invocation of pending) {
      const { id } = invocation.params;
      if (invocation.name === 'openSong' && songs.some((song) => song.id === id)) {
        router.push(`/dainos/${id}`);
      } else {
        console.warn('Discarding App Intent', invocation);
      }
      await AppIntents.removePendingInvocationAsync(invocation.id);
    }
  });

  return null;
}
