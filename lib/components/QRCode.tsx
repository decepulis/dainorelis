import { ImageStyle, StyleProp } from 'react-native';

import { Image } from 'expo-image';

import { toQR } from 'toqr';

// toqr's error correction levels (a const enum in its types): L, the lowest, keeps long links scannable
const errorCorrectionL = 1 as Parameters<typeof toQR>[1];
const quietZone = 4;

/**
 * an SVG of the code: one path of horizontal runs, on a white square with the standard quiet zone. Null when the
 * content doesn't fit in a QR code (toqr throws past version 40's capacity, ~2,950 bytes at level L)
 */
export function qrSvg(content: string) {
  let modules: ReturnType<typeof toQR>;
  try {
    modules = toQR(content, errorCorrectionL);
  } catch (error) {
    if (error instanceof RangeError) return null;
    throw error;
  }
  const size = Math.sqrt(modules.length);
  let path = '';
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!modules[y * size + x]) continue;
      let run = 1;
      while (x + run < size && modules[y * size + x + run]) run++;
      path += `M${x + quietZone} ${y + quietZone}h${run}v1h-${run}z`;
      x += run - 1;
    }
  }
  const box = size + quietZone * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${box} ${box}" shape-rendering="crispEdges"><rect width="${box}" height="${box}" fill="#fff"/><path d="${path}" fill="#000"/></svg>`;
}

type Props = { svg: string; size: number; accessibilityLabel?: string; style?: StyleProp<ImageStyle> };

/** A QR code from qrSvg(), drawn by expo-image (no SVG library needed) */
export default function QRCode({ svg, size, accessibilityLabel, style }: Props) {
  return (
    <Image
      // base64: Android's decoder doesn't read a percent-encoded data URI (the SVG is ASCII, so btoa is enough)
      source={{ uri: `data:image/svg+xml;base64,${btoa(svg)}` }}
      style={[{ width: size, height: size }, style]}
      contentFit="contain"
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
}
