import { preload } from 'react-dom';

import { Asset } from 'expo-asset';

/**
 * Called while rendering: the statically rendered HTML asks for the image right away, rather than when expo-image
 * first renders it, after hydration
 */
export default function preloadImage(source: number) {
  preload(Asset.fromModule(source).uri, { as: 'image' });
}
