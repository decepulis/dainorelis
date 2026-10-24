/**
 * Generates the app icons, splash, favicons and link preview image from the brand sources:
 *   assets/images/icon_v3.svg       the app icon (a background rect, the star path and its diamond)
 *   assets/images/logo_white_v3.svg the wordmark (live text: needs Modeka Extended Bold installed)
 *
 *   pnpm tsx scripts/generate-brand-assets.ts
 *
 * The mark is cut out of icon_v3.svg and re-centred on its measured bounds, so every output gets
 * proportions tuned for its own mask instead of one shared crop.
 */
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const images = 'assets/images';
const source = readFileSync(`${images}/icon_v3.svg`, 'utf8');

const background = rgbToHex(source.match(/<rect[^>]*fill:rgb\(([^)]+)\)/)![1]);
// the mark: everything after the background group
const mark = source.slice(source.indexOf('</g>') + 4, source.lastIndexOf('</svg>'));
// its two parts, for single-colour and layered outputs
const star = mark.replace(/<g[^>]*>\s*<rect[^>]*\/>\s*<\/g>/, '');
const diamond = mark.replace(/<g[^>]*>\s*<path[^>]*\/>\s*<\/g>/, '');
const sourceSize = Number(source.match(/viewBox="0 0 (\d+)/)![1]);

function rgbToHex(rgb: string) {
  return (
    '#' +
    rgb
      .split(',')
      .map((c) => Number(c).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

const svg = (size: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${body}</svg>`;

/** the mark's bounding box in source units, measured from a render */
async function measure(content: string) {
  const scale = 4;
  const { data, info } = await sharp(Buffer.from(svg(sourceSize, content)), { density: 72 * scale })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let [x0, y0, x1, y1] = [Infinity, Infinity, 0, 0];
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 8) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x + 1);
        y1 = Math.max(y1, y + 1);
      }
  const k = sourceSize / info.width;
  return { cx: ((x0 + x1) / 2) * k, cy: ((y0 + y1) / 2) * k, size: Math.max(x1 - x0, y1 - y0) * k };
}
let box: Awaited<ReturnType<typeof measure>>;

/** the mark (or one of its parts) centred on a square canvas, its larger side `fraction` of it */
function placed(size: number, fraction: number, content = mark) {
  const s = (size * fraction) / box.size;
  return `<g transform="translate(${size / 2} ${size / 2}) scale(${s}) translate(${-box.cx} ${-box.cy})">${content}</g>`;
}

const rect = (size: number, fill: string, radius = 0) =>
  `<rect width="${size}" height="${size}" rx="${radius}" fill="${fill}"/>`;

async function png(file: string, body: string, size: number, opts: { flatten?: boolean } = {}) {
  let image = sharp(Buffer.from(svg(size, body)), { density: 72 * 4 }).resize(size, size);
  if (opts.flatten) image = image.flatten({ background });
  await image.png({ compressionLevel: 9 }).toFile(file);
}

async function main() {
  box = await measure(mark);

  // The source draws the mark at 57% of the icon. Keep that for the iOS / legacy icon.
  const iconFraction = 0.57;

  // iOS (pre-26), Android legacy, and the Play Store listing icon
  await png(`${images}/icon.png`, rect(1024, background) + placed(1024, iconFraction), 1024, { flatten: true });
  await png(`${images}/icon_512.png`, rect(512, background) + placed(512, iconFraction), 512, { flatten: true });

  // Android adaptive icon: a 108dp canvas, 72dp visible after the launcher's mask, a 66dp safe circle.
  // 40% of the canvas makes the mark 60% of the visible icon (iOS: 57%) and keeps the star's tips
  // inside the safe circle.
  await png(`${images}/adaptive-icon.png`, placed(1024, 0.4), 1024);
  await png(`${images}/adaptive-icon-monochrome.png`, placed(1024, 0.4, star), 1024);

  // Splash: Android 12+ masks the splash icon to a circle 2/3 of its box, so the star's tips need the
  // mark at 55% or less. iOS draws the same image at imageWidth.
  await png(`${images}/splash-icon.png`, placed(1024, 0.55), 1024);

  // iOS 26 Icon Composer layers: full-canvas SVGs, so the layers stay registered to each other
  const layer = (content: string) => svg(1024, placed(1024, iconFraction, content));
  writeFileSync(`${images}/icon.icon/Assets/star.svg`, layer(star));
  writeFileSync(`${images}/icon.icon/Assets/diamond.svg`, layer(diamond));

  // Web. Small sizes get a tighter crop (the mark fills more of the square) and rounded corners, since
  // a browser tab doesn't round them; 16px drops the diamond's 2px sliver of yellow for a clean star.
  const favicon = (size: number, fraction: number, content = mark) =>
    rect(size, background, size * 0.18) + placed(size, fraction, content);
  mkdirSync('public', { recursive: true });
  const icoSizes = [
    [16, 0.84, star],
    [32, 0.8, mark],
    [48, 0.78, mark],
  ] as const;
  const icoImages = await Promise.all(
    icoSizes.map(([size, fraction, content]) =>
      sharp(Buffer.from(svg(size, favicon(size, fraction, content))), { density: 72 * 8 })
        .resize(size, size)
        .png()
        .toBuffer()
    )
  );
  writeFileSync(
    'public/favicon.ico',
    ico(
      icoImages,
      icoSizes.map(([size]) => size)
    )
  );
  writeFileSync('public/favicon.svg', svg(64, favicon(64, 0.78)));
  await png(`${images}/favicon.png`, favicon(48, 0.78), 48);
  // iOS rounds the home screen icon itself, so this one is full bleed at the app icon's proportions
  await png('public/apple-touch-icon.png', rect(180, background) + placed(180, 0.62), 180, { flatten: true });

  // Link previews: the misty forest and the wordmark
  if (hasFont('Modeka Extended')) {
    const logo = readFileSync(`${images}/logo_white_v3.svg`, 'utf8');
    for (const scale of [2, 3])
      await sharp(Buffer.from(logo), { density: 72 * scale })
        .png({ compressionLevel: 9 })
        .toFile(`${images}/logo_white_v3@${scale}x.png`);

    const [w, h] = [1200, 630];
    const logoWidth = 720;
    const logoImage = await sharp(Buffer.from(logo), { density: 72 * 4 })
      .resize(logoWidth)
      .png()
      .toBuffer();
    const logoHeight = (await sharp(logoImage).metadata()).height!;
    const shade = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#121614" opacity="0.28"/></svg>`
    );
    await sharp(`${images}/miskas.jpg`)
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .composite([
        { input: shade },
        { input: logoImage, left: (w - logoWidth) / 2, top: Math.round((h - logoHeight) / 2) },
      ])
      .jpeg({ quality: 85, mozjpeg: true })
      .toFile('public/og.jpg');
  } else {
    console.warn('Modeka Extended is not installed: skipped the wordmark PNGs and public/og.jpg');
  }

  console.log(`Generated brand assets (background ${background})`);
}

function hasFont(family: string) {
  try {
    return execSync('fc-list', { encoding: 'utf8' }).includes(family);
  } catch {
    return false;
  }
}

/** an .ico holding PNG images */
function ico(pngs: Buffer[], sizes: number[]) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach((data, i) => {
    const entry = 6 + 16 * i;
    header.writeUInt8(sizes[i] % 256, entry);
    header.writeUInt8(sizes[i] % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs]);
}

main();
