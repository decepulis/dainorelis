import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createMMKV } from 'react-native-mmkv';

import { z } from 'zod';

import { clampPlaylistName } from '@/lib/constants/playlistName';

// Create a single MMKV instance
export const storage = createMMKV();

// if you wanna store anything in async storage, define it here
const schemas = {
  // the Favorites playlist's song ids, in the order they were added (the key predates playlists)
  favorites: {
    validator: z.array(z.string()),
    defaultValue: [] as string[],
  },
  // the user's own playlists, in the order they were created. A long name is cut rather than rejected, which
  // would drop every playlist
  playlists: {
    validator: z.array(
      z.object({
        id: z.string(),
        name: z.string().transform((name) => clampPlaylistName(name)),
        songIds: z.array(z.string()),
      })
    ),
    defaultValue: [] as { id: string; name: string; songIds: string[] }[],
  },
  // the playlist the home screen shows: 'all', 'favorites', a curated or a user playlist's id
  selectedPlaylistId: {
    validator: z.string(),
    defaultValue: 'all',
  },
  activeVariantIdBySongId: {
    validator: z.record(z.string(), z.string().optional()),
    defaultValue: {} as Record<string, string | undefined>,
  },
  activeMediaIdBySongId: {
    validator: z.record(z.string(), z.string().optional()),
    defaultValue: {} as Record<string, string | undefined>,
  },
  language: {
    validator: z.enum(['en', 'lt']),
    defaultValue: 'lt',
  },
  theme: {
    validator: z.enum(['auto', 'dark', 'light']),
    defaultValue: 'auto',
  },
  showChords: {
    validator: z.boolean(),
    defaultValue: false,
  },
};

// after that, this gets a bit complicated.
// this is a context which stores all the values from local storage for access across the app
// and tries to keep the context and the local storage in sync
type Schemas = typeof schemas;
type Value<Key extends keyof Schemas> = z.infer<Schemas[Key]['validator']>;
type StorageContextValues = {
  [key in keyof Schemas]: {
    value: Value<key>;
  };
};
/** a new value, or a function of the current one (always the latest written, even within one event handler) */
type Update<Key extends keyof Schemas> = Value<Key> | ((current: Value<Key>) => Value<Key>);
type StorageContextSetValue = <Key extends keyof Schemas>(key: Key, update: Update<Key>) => void;
type StorageContextType = {
  values: StorageContextValues;
  setValue: StorageContextSetValue;
};
const defaultContextValues = Object.fromEntries(
  Object.entries(schemas).map(([key, { defaultValue }]) => [key, { value: defaultValue }])
) as StorageContextValues;

const defaultContext: StorageContextType = { values: defaultContextValues, setValue: () => {} };

const StorageContext = createContext(defaultContext);

const readStoredValues = () =>
  Object.fromEntries(
    Object.entries(schemas).map(([key, { defaultValue, validator }]) => {
      const stored = storage.getString(key);
      if (stored) {
        try {
          return [key, { value: validator.parse(JSON.parse(stored)) }];
        } catch (e) {
          if (e instanceof z.ZodError) {
            console.error(`Error parsing ${key} from MMKV:`, z.prettifyError(e));
          }
        }
      }
      return [key, { value: defaultValue }];
    })
  ) as StorageContextValues;

export function StorageProvider({ children }: { children: React.ReactNode }) {
  // web: statically rendered pages have no localStorage on the server, and hydration has to match their HTML, so
  // the stored values come in right after it
  const [values, setValues] = useState(process.env.EXPO_OS === 'web' ? defaultContextValues : readStoredValues);
  // what was last written, for updates made before React re-renders with it (two quick toggles)
  const latest = useRef(values);
  useEffect(() => {
    if (process.env.EXPO_OS !== 'web') return;
    latest.current = readStoredValues();
    setValues(latest.current);
  }, []);

  const setValue: StorageContextSetValue = (key, update) => {
    const current = latest.current[key].value;
    const next = typeof update === 'function' ? update(current) : update;
    const result = schemas[key].validator.safeParse(next);
    if (!result.success) {
      // a bug, not something the user can fix: keep the last valid value
      console.error(`Invalid value for ${key}:`, z.prettifyError(result.error));
      return;
    }
    latest.current = { ...latest.current, [key]: { value: result.data } };
    setValues(latest.current);
    storage.set(key, JSON.stringify(result.data));
  };

  return <StorageContext.Provider value={{ values, setValue }}>{children}</StorageContext.Provider>;
}

export default function useStorage<Key extends keyof Schemas>(key: Key) {
  const { values, setValue } = useContext(StorageContext);
  const value = values[key];

  return {
    value: value.value,
    setValue: (update: Update<Key>) => setValue(key, update),
  };
}
