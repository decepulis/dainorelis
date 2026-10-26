import { File, Paths } from 'expo-file-system';

// react-native-pdf (source.cache) keeps downloaded sheet music in the cache directory's root as <sha1>.pdf; its
// in-flight downloads are .tmp files, left alone. A PDF on screen stays open after its file is deleted, and the
// next visit downloads it again
const cachedPdfs = () => Paths.cache.list().filter((f) => f instanceof File && f.extension === '.pdf') as File[];

/** bytes */
export const sheetMusicCacheSize = () => cachedPdfs().reduce((total, file) => total + file.size, 0);

export const clearSheetMusicCache = () => cachedPdfs().forEach((file) => file.delete());

/** "12 MB", or "<1 MB" for anything smaller (decimal megabytes, like iOS and Android storage settings), unbroken */
export const formatMegabytes = (bytes: number) => (bytes < 1e6 ? '<1\u00a0MB' : `${Math.round(bytes / 1e6)}\u00a0MB`);
