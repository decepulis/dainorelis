import { createContext, useCallback, useContext, useState } from 'react';
import { createMMKV } from 'react-native-mmkv';

import { z } from 'zod';

// Create a single MMKV instance
export const storage = createMMKV();

// if you wanna store anything in async storage, define it here
const schemas = {
  favorites: {
    validator: z.array(z.string()),
    defaultValue: [] as string[],
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
  const [values, setValues] = useState<StorageContextValues>(() => {
    return Object.fromEntries(
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
  });

  const setValue: StorageContextSetValue = useCallback(async function (key, value) {
    try {
      // validate the value
      const { validator } = schemas[key];
      const validValue = validator.parse(value);

      // then, update state
      setValues((prev) => ({
        ...prev,
        [key]: { ...prev[key], value: validValue },
      }));

      // finally, set the value in Storage
      storage.set(key, JSON.stringify(validValue));
    } catch (e) {
      if (e instanceof z.ZodError) {
        console.error(`Invalid value for ${key}:`, z.prettifyError(e));
        // Consider: show user-facing toast/alert here
        throw e; // Re-throw so caller knows it failed
      }
      throw e;
    }
  }, []);

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
