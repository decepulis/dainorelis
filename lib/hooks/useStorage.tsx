import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { MMKV } from 'react-native-mmkv';

// TODO zod 4 for perf
import { z } from 'zod';

import { Playlist, PlaylistSchema } from '../components/Playlists/types';

// Create a single MMKV instance
export const storage = new MMKV();

// if you wanna store anything in async storage, define it here
const schemas = {
  favorites: {
    validator: z.array(z.string()),
    defaultValue: [] as string[],
  },
  playlists: {
    validator: z.array(PlaylistSchema),
    defaultValue: [] as Playlist[],
  },
  activeVariantIdBySongId: {
    validator: z.record(z.string().optional()),
    defaultValue: {} as Record<string, string>,
  },
  activeMediaIdBySongId: {
    validator: z.record(z.string().optional()),
    defaultValue: {} as Record<string, string>,
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
type StorageContextValues = {
  [key in keyof typeof schemas]: {
    value: z.infer<(typeof schemas)[key]['validator']>;
  };
};
type StorageContextSetValue = <Key extends keyof typeof schemas>(
  key: Key,
  value: z.infer<(typeof schemas)[Key]['validator']>
) => Promise<void>;
type StorageContextType = {
  values: StorageContextValues;
  setValue: StorageContextSetValue;
};
const defaultContextValues = Object.fromEntries(
  Object.entries(schemas).map(([key, { defaultValue }]) => [key, { value: defaultValue }])
) as StorageContextValues;

const defaultContext: StorageContextType = { values: defaultContextValues, setValue: async () => {} };

const StorageContext = createContext(defaultContext);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [values, setValues] = useState(() => defaultContextValues);

  const setValue: StorageContextSetValue = useCallback(async function (key, value) {
    // validate the value
    const { validator } = schemas[key];
    const validValue = validator.parse(value);

    // then, update state
    setValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: validValue },
    }));

    // finally, set the value in Storage
    // todo: error behavior
    storage.set(key, JSON.stringify(validValue));
  }, []);

  // on load, initialize all the values using the setValue function we just wrote
  useEffect(() => {
    for (const key of Object.keys(schemas) as (keyof typeof schemas)[]) {
      const value = storage.getString(key);
      if (value) {
        try {
          const parsedValue = JSON.parse(value);
          setValue(key, parsedValue);
        } catch (e) {
          if (e instanceof z.ZodError) {
            // treat parsing errors as if the key doesn't exist in local storage
            console.error(`Error parsing ${key} from MMKV:`, e.errors);
            // todo fix ts
            setValue(key, schemas[key].defaultValue);
          } else {
            throw e;
          }
        }
      } else {
        // no value? default.
        setValue(key, schemas[key].defaultValue);
      }
    }
  }, [setValue]);

  return <StorageContext.Provider value={{ values, setValue }}>{children}</StorageContext.Provider>;
}

export default function useStorage<Key extends keyof typeof schemas>(key: Key) {
  const { values, setValue } = useContext(StorageContext);
  const value = values[key];

  return {
    value: value.value,
    setValue: (value: z.infer<(typeof schemas)[Key]['validator']>) => setValue(key, value),
  };
}
