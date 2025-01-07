import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';
import z from 'zod';

// if you wanna store anything in async storage, define it here
const schemas = {
  favorites: {
    validator: z.array(z.string()),
    defaultValue: [] as string[],
  },
  language: {
    validator: z.enum(['en', 'lt']),
    defaultValue: 'lt',
  },
};

// after that, this gets a bit complicated.
// this is a context which stores all the values from local storage for access across the app
// and tries to keep the context and the local storage in sync
type StorageContextValues = {
  [key in keyof typeof schemas]: {
    value: z.infer<(typeof schemas)[key]['validator']>;
    loading: boolean;
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
  Object.entries(schemas).map(([key, { defaultValue }]) => [key, { value: defaultValue, loading: true }])
) as StorageContextValues;

const defaultContext: StorageContextType = { values: defaultContextValues, setValue: async () => {} };

const StorageContext = createContext(defaultContext);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [values, setValues] = useState(() => defaultContextValues);

  const setValue: StorageContextSetValue = useCallback(async function (key, value) {
    // first, set loading to true
    setValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], loading: true },
    }));

    // next, validate the value
    const { validator } = schemas[key];
    const validValue = validator.parse(value);

    // then, set the value in Storage
    await AsyncStorage.setItem(key, JSON.stringify(validValue));

    // finally, update state
    setValues((prev) => ({
      ...prev,
      [key]: { ...prev[key], value: validValue, loading: false },
    }));
  }, []);

  // on load, initialize all the values using the setValue function we just wrote
  useEffect(() => {
    const load = async () => {
      for (const key of Object.keys(schemas) as (keyof typeof schemas)[]) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          try {
            const parsedValue = JSON.parse(value);
            setValue(key, parsedValue);
          } catch (e) {
            if (e instanceof z.ZodError) {
              // treat parsing errors as if the key doesn't exist in local storage
              console.error(`Error parsing ${key} from AsyncStorage:`, e.errors);
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
    };

    load();
  }, [setValue]);

  return <StorageContext.Provider value={{ values, setValue }}>{children}</StorageContext.Provider>;
}

export default function useStorage<Key extends keyof typeof schemas>(key: Key) {
  const { values, setValue } = useContext(StorageContext);
  const value = values[key];

  return {
    value: value.value,
    loading: value.loading,
    setValue: (value: z.infer<(typeof schemas)[Key]['validator']>) => setValue(key, value),
  };
}
