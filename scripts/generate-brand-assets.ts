/**
 * Generates the app icons, splash, favicons, wordmarks, header photo and link preview images from the brand
 * sources:
 *   assets/images/icon_v3.svg       the app icon (a background rect, the star path and its diamond)
 *   assets/images/logo_white_v3.svg the logo (frame, lettering and mark, all outlined)
 *   assets/images/miskas_v3.jpg     the forest photo (Sebastian Unrau, Unsplash)
 *
 *   pnpm tsx scripts/generate-brand-assets.ts
 *
 * The mark is cut out of icon_v3.svg and re-centred on its measured bounds, so every output gets
 * proportions tuned for its own mask instead of one shared crop.
 */
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
  // themed icons tint every opaque pixel one colour; the diamond still reads, as an island in the star's hole
  await png(`${images}/adaptive-icon-monochrome.png`, placed(1024, 0.4), 1024);

  // Splash: Android 12+ masks the splash icon to a circle 2/3 of its box, so the star's tips need the
  // mark at 55% or less. iOS draws the same image at imageWidth.
  await png(`${images}/splash-icon.png`, placed(1024, 0.55), 1024);

  // iOS 26 Icon Composer layers: full-canvas SVGs, so the layers stay registered to each other
  const layer = (content: string) => svg(1024, placed(1024, iconFraction, content));
  writeFileSync(`${images}/icon.icon/Assets/star.svg`, layer(star));
  writeFileSync(`${images}/icon.icon/Assets/diamond.svg`, layer(diamond));
  // and the background fill: the first "solid" in icon.json. Everything else in it (glass, specular, shadow,
  // translucency, dark and tinted variants) is Icon Composer's, edited there and left alone here
  const iconJson = `${images}/icon.icon/icon.json`;
  const srgb = (hex: string) =>
    [1, 3, 5].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(5)).join(',') + ',1.00000';
  // (the document's top-level fill; layer fills, like the star's dark-mode tint, come later in the file)
  const rootFill = /^(\{\s*"fill-specializations" : \[\s*\{\s*"value" : \{\s*"solid" : )"[^"]*"/;
  const iconDocument = readFileSync(iconJson, 'utf8');
  if (!rootFill.test(iconDocument)) throw new Error(`${iconJson} doesn't start with a solid background fill`);
  writeFileSync(iconJson, iconDocument.replace(rootFill, `$1"srgb:${srgb(background)}"`));

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
  // the admin app's tab and home screen icons
  writeFileSync('admin/src/app/icon.svg', svg(64, favicon(64, 0.78)));
  await png('admin/src/app/apple-icon.png', rect(512, background) + placed(512, 0.62), 512, { flatten: true });

  // The wordmark, sharp on 2x and 3x screens; logo_white.png is the 1x under its v1 name
  const logo = readFileSync(`${images}/logo_white_v3.svg`, 'utf8');
  await sharp(Buffer.from(logo)).png({ compressionLevel: 9 }).toFile(`${images}/logo_white.png`);
  for (const scale of [2, 3])
    await sharp(Buffer.from(logo), { density: 72 * scale })
      .png({ compressionLevel: 9 })
      .toFile(`${images}/logo_white_v3@${scale}x.png`);

  // The plain wordmarks (the logo's lettering without the frame and the mark), at their v1 size
  const textStart = logo.indexOf('/>', logo.indexOf('stroke-width:30px')) + 2;
  const lettering = logo.slice(textStart, logo.lastIndexOf('<g>'));
  if (!lettering.includes('<path')) throw new Error("couldn't find the lettering in logo_white_v3.svg");
  for (const [name, color] of [
    ['black', '#18201B'], // ink: the brand never uses pure black
    ['primary', '#2F5240'], // eglė
    ['white', '#FFFFFF'],
  ]) {
    const art = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 747 177">${lettering.replaceAll('fill:#fff', `fill:${color}`)}</svg>`;
    const trimmed = await sharp(Buffer.from(art), { density: 72 * 4 })
      .trim()
      .toBuffer();
    await sharp(trimmed)
      .resize(502, 105, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(`${images}/wordmark_${name}.png`);
  }

  // The home screen's forest: Sebastian Unrau's photo (miskas_v3.jpg) in v1's miskas_fade_10.webp metrics, so
  // app/index.tsx shows it the same way: 2200x968, opaque down to the middle, then a linear fade to transparent at
  // the bottom, which the list covers. The full width of the frame (the photo is a close-up, so as little zoom as
  // the shape allows), from the canopy down, so the dark treetops sit behind the logo
  const [fw, fh] = [2200, 968];
  const forestTop = 400;
  const photo = `${images}/miskas_v3.jpg`;
  const fade = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fw}" height="${fh}"><defs><linearGradient id="f" x2="0" y2="1">` +
      '<stop offset="0.5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>' +
      `<rect width="${fw}" height="${fh}" fill="url(#f)"/></svg>`
  );
  await sharp(photo)
    .extract({ left: 0, top: forestTop, width: 6000, height: Math.round((6000 * fh) / fw) })
    .resize(fw, fh)
    .ensureAlpha()
    .composite([{ input: fade, blend: 'dest-in' }])
    .webp({ quality: 85, alphaQuality: 100 })
    .toFile(`${images}/miskas_v3_fade.webp`);

  // Link previews and the Play Store feature graphic: the forest, a light shade, the logo in the middle 60%
  async function poster(file: string, w: number, h: number) {
    const logoWidth = Math.round(w * 0.6);
    const logoImage = await sharp(Buffer.from(logo), { density: 72 * 4 })
      .resize(logoWidth)
      .png()
      .toBuffer();
    const logoHeight = (await sharp(logoImage).metadata()).height!;
    const shade = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#121614" opacity="0.2"/></svg>`
    );
    const composed = await sharp(photo)
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .composite([
        { input: shade },
        { input: logoImage, left: Math.round((w - logoWidth) / 2), top: Math.round((h - logoHeight) / 2) },
      ])
      .toBuffer();
    // opaque: the Play Console rejects a feature graphic with alpha
    const image = sharp(composed).removeAlpha();
    await (
      file.endsWith('.jpg') ? image.jpeg({ quality: 85, mozjpeg: true }) : image.png({ compressionLevel: 9 })
    ).toFile(file);
  }
  await poster('public/og.jpg', 1200, 630);
  await poster(`${images}/miskas_og.png`, 1200, 629);
  await poster(`${images}/miskas_twitter.png`, 1200, 600);
  await poster(`${images}/miskas_google_play.png`, 1024, 500);

  console.log(`Generated brand assets (background ${background})`);
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
