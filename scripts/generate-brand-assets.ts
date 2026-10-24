/**
 * Generates the logo, app icons, splash, favicons, wordmarks, header photo and link preview images from the brand
 * sources:
 *   assets/images/icon_v3.svg              the mark alone: the white star <path> and the diamond <rect> in its hole
 *   assets/images/miskas_v3.jpg            the forest photo (Sebastian Unrau, Unsplash)
 *   assets/fonts/ModekaExtended-Bold.otf   the logo's lettering
 * and the icon's background, eglė, from lib/constants/brandColors.ts.
 *
 *   pnpm tsx scripts/generate-brand-assets.ts
 *
 * The mark is re-centred on its measured bounds, so every output gets proportions tuned for its own mask instead of
 * one shared crop, and icon_v3.svg's own placement and scale don't matter. The logo (logo_white_v3.svg and the kit in
 * assets/images/brand/) is built from the mark, the font and the `lockup` constants below.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'opentype.js';
import sharp from 'sharp';

import { brandColors } from '../lib/constants/brandColors';

/**
 * The logo: a frame around a square cell holding the mark and a wider one holding the lettering, in px at 1x
 * (747x177; the home header's layout maths assume that aspect). Measured off v3's hand-drawn logo.
 */
const lockup = {
  height: 177,
  // the frame's line, also the divider between the two cells (square corners)
  border: 15,
  // the mark's larger side, centred in the square cell
  markSize: 102,
  font: 'assets/fonts/ModekaExtended-Bold.otf',
  text: 'DAINORĖLIS',
  // 125 makes the caps 89 tall
  fontSize: 125,
  baseline: 138.875,
  // font units after every letter (0.01 em)
  tracking: 10,
  // the hand-drawn logo had none; the font's only pair here would pull D and A 1.25px closer
  kerning: false,
  // from the divider to the first letter's ink, and from the last letter's ink to the frame; the lettering's width
  // and these set the logo's width
  padding: [29.25, 27.75],
};

// the kit's colours, by file name
const colors = { white: '#FFFFFF', ink: brandColors.ink, egle: brandColors.egle };
// the icon's background (app.config.ts gives the adaptive icon and splash the same)
const background = brandColors.egle;

const images = 'assets/images';
const sourceFile = `${images}/icon_v3.svg`;
const { size: sourceSize, star, diamond } = readMark(readFileSync(sourceFile, 'utf8'));
// diamond first, as drawn: it sits in the star's hole
const mark = diamond + star();

/**
 * icon_v3.svg's two shapes, each as its element wrapped in its ancestors' transforms: the star (the one <path>, as a
 * function taking an optional fill for the single-colour logos) and the diamond (the one <rect>). Anything else
 * drawable, like a background rect, is an error: the background comes from brandColors.
 */
function readMark(source: string) {
  const fail = (why: string): never => {
    throw new Error(`${sourceFile}: ${why}. It should hold only the mark: one star <path> and one diamond <rect>`);
  };
  type Element = { name: string; attrs: string; tag: string; transforms: string[] };
  const shapes: Element[] = [];
  const stack: Element[] = [];
  let viewBox: string | undefined;
  for (const [tag, close, name, attrs, selfClosing] of source
    .replace(/<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!DOCTYPE[^>]*>/g, '')
    .matchAll(/<(\/?)([\w:-]+)([^>]*?)(\/?)>/g)) {
    if (close) {
      if (stack.pop()?.name !== name) fail(`unbalanced </${name}>`);
      continue;
    }
    const transform = attrs.match(/\stransform="([^"]*)"/)?.[1];
    const transforms = [...(stack.at(-1)?.transforms ?? []), ...(transform ? [transform] : [])];
    const element = { name, attrs, tag, transforms };
    if (name === 'svg') viewBox = attrs.match(/\sviewBox="([^"]*)"/)?.[1];
    else if (!['g', 'defs', 'title', 'desc', 'metadata'].includes(name)) shapes.push(element);
    if (!selfClosing) stack.push(element);
  }
  if (stack.length) fail(`<${stack.at(-1)!.name}> isn't closed`);
  const [x, y, w, h] = viewBox?.split(/[\s,]+/).map(Number) ?? [];
  if (x !== 0 || y !== 0 || !(w > 0) || w !== h) fail(`expected a square viewBox="0 0 n n", found "${viewBox}"`);
  const only = (name: string) => {
    const found = shapes.filter((e) => e.name === name);
    if (found.length !== 1) fail(`found ${found.length} <${name}> elements`);
    return found[0];
  };
  const [path, rect] = [only('path'), only('rect')];
  const others = shapes.filter((e) => e !== path && e !== rect);
  if (others.length) fail(`unexpected <${others.map((e) => e.name).join('>, <')}>`);
  const placedIn = ({ transforms }: Element, tag: string) =>
    transforms.reduceRight((inner, t) => `<g transform="${t}">${inner}</g>`, tag);
  return {
    size: w,
    star: (fill?: string) =>
      placedIn(
        path,
        fill
          ? `<path${path.attrs.replace(/\s(fill|style)="[^"]*"/g, '').replace(/\s*\/$/, '')} fill="${fill}"/>`
          : path.tag
      ),
    diamond: placedIn(rect, rect.tag),
  };
}

const svg = (size: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">${body}</svg>`;

/** the mark's bounding box in source units, measured from a render */
async function measure(content: string) {
  const scale = 8;
  const { data, info } = await sharp(Buffer.from(svg(sourceSize, content)), { density: 72 * scale })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let [x0, y0, x1, y1] = [Infinity, Infinity, 0, 0];
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 127) {
        x0 = Math.min(x0, x);
        y0 = Math.min(y0, y);
        x1 = Math.max(x1, x + 1);
        y1 = Math.max(y1, y + 1);
      }
  const k = sourceSize / info.width;
  const [w, h] = [(x1 - x0) * k, (y1 - y0) * k];
  return { cx: ((x0 + x1) / 2) * k, cy: ((y0 + y1) / 2) * k, w, h, size: Math.max(w, h) };
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
  lettering = typeset();

  // The mark at 68% of the icon, the way first-party icons fill the squircle (v3's first drawing had it at 57%, which
  // read small on the home screen)
  const iconFraction = 0.68;

  // iOS (pre-26), Android legacy, and the Play Store listing icon
  await png(`${images}/icon.png`, rect(1024, background) + placed(1024, iconFraction), 1024, { flatten: true });
  await png(`${images}/icon_512.png`, rect(512, background) + placed(512, iconFraction), 512, { flatten: true });

  // Android adaptive icon: a 108dp canvas, 72dp visible after the launcher's mask, a 66dp safe circle.
  // 46% of the canvas makes the mark 69% of the visible icon (iOS: 68%); the star's tips reach 1.17x its half
  // width, so up to 52% stays inside the safe circle
  await png(`${images}/adaptive-icon.png`, placed(1024, 0.46), 1024);
  // themed icons tint every opaque pixel one colour; the diamond still reads, as an island in the star's hole
  await png(`${images}/adaptive-icon-monochrome.png`, placed(1024, 0.46), 1024);

  // Splash: Android 12+ masks the splash icon to a circle 2/3 of its box, so the star's tips need the
  // mark at 55% or less. iOS draws the same image at imageWidth.
  await png(`${images}/splash-icon.png`, placed(1024, 0.55), 1024);

  // iOS 26 Icon Composer layers: full-canvas SVGs, so the layers stay registered to each other
  const layer = (content: string) => svg(1024, placed(1024, iconFraction, content));
  writeFileSync(`${images}/icon.icon/Assets/star.svg`, layer(star()));
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
    [16, 0.84, star()],
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
  await png('public/apple-touch-icon.png', rect(180, background) + placed(180, iconFraction), 180, { flatten: true });
  // the admin app's tab and home screen icons
  writeFileSync('admin/src/app/icon.svg', svg(64, favicon(64, 0.78)));
  await png('admin/src/app/apple-icon.png', rect(512, background) + placed(512, iconFraction), 512, { flatten: true });

  // The logo: logo_white_v3.svg and its PNGs (logo_white.png is the 1x under its v1 name), and the kit in brand/:
  // the logo and the unframed lockup in each brand colour, as SVG and 3x PNG
  const logo = logoSvg(colors.white);
  writeFileSync(`${images}/logo_white_v3.svg`, logo);
  const toPng = (art: string, file: string, scale = 1) =>
    sharp(Buffer.from(art), { density: 72 * scale })
      .png({ compressionLevel: 9 })
      .toFile(file);
  await toPng(logo, `${images}/logo_white.png`);
  await toPng(logo, `${images}/logo_white_v3.png`);
  for (const scale of [2, 3]) await toPng(logo, `${images}/logo_white_v3@${scale}x.png`, scale);
  const kit = `${images}/brand`;
  mkdirSync(kit, { recursive: true });
  for (const [name, color] of Object.entries(colors))
    for (const [file, art] of [
      [`logo_${name}`, logoSvg(color)],
      [`logo_unframed_${name}`, logoSvg(color, false)],
    ]) {
      writeFileSync(`${kit}/${file}.svg`, art);
      await toPng(art, `${kit}/${file}.png`, 3);
    }

  // The plain wordmarks (the lettering alone), at their v1 size
  const { x1, y1, x2, y2 } = lettering.box;
  for (const [name, color] of [
    ['black', colors.ink], // the brand never uses pure black
    ['primary', colors.egle],
    ['white', colors.white],
  ]) {
    const art = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x1} ${y1} ${x2 - x1} ${y2 - y1}"><g fill="${color}">${lettering.paths}</g></svg>`;
    await sharp(Buffer.from(art), { density: 72 * 4 })
      .resize(502, 105, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(`${images}/wordmark_${name}.png`);
  }

  // The home screen's forest: Sebastian Unrau's photo (miskas_v3.jpg) in v1's miskas_fade_10.webp metrics, so
  // app/index.tsx shows it the same way: 2200x968, opaque down to the middle, then a linear fade to transparent at
  // the bottom, which the list covers. The full width of the frame (the photo is a close-up, so as little zoom as
  // the shape allows), from the canopy down, so the dark treetops sit behind the logo. A soft darkening behind the
  // logo's band (centred, about a quarter of the way down, where every layout puts it) keeps the white logo legible
  // over the lit branches
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
    .composite([{ input: shadeBehind(fw, fh, fw / 2, 260, 760, 300, 0.45) }, { input: fade, blend: 'dest-in' }])
    .webp({ quality: 85, alphaQuality: 100 })
    .toFile(`${images}/miskas_v3_fade.webp`);

  // Link previews and the Play Store feature graphic: the forest, a light shade and a darker one behind the logo,
  // which takes the middle 60%
  async function poster(file: string, w: number, h: number) {
    const logoWidth = Math.round(w * 0.6);
    const logoImage = await sharp(Buffer.from(logo), { density: 72 * 4 })
      .resize(logoWidth)
      .png()
      .toBuffer();
    const logoHeight = (await sharp(logoImage).metadata()).height!;
    const shade = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#141615" opacity="0.15"/></svg>`
    );
    const composed = await sharp(photo)
      .resize(w, h, { fit: 'cover', position: 'centre' })
      .composite([
        { input: shade },
        { input: shadeBehind(w, h, w / 2, h / 2, w * 0.45, h * 0.4, 0.4) },
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

/** the lettering's glyph outlines, one path per letter, placed in the logo's lettering cell */
function typeset() {
  const data = readFileSync(lockup.font);
  const font = parse(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  const scale = lockup.fontSize / font.unitsPerEm;
  const glyphs = font.stringToGlyphs(lockup.text);
  const layout = (x0: number) => {
    let x = x0;
    return glyphs.map((glyph, i) => {
      const path = glyph.getPath(x, lockup.baseline, lockup.fontSize);
      const next = glyphs[i + 1];
      x +=
        (glyph.advanceWidth! + lockup.tracking + (lockup.kerning && next ? font.getKerningValue(glyph, next) : 0)) *
        scale;
      return path;
    });
  };
  // set once to find the ink, then again with the first letter's ink at the padding
  const inkLeft = Math.min(...layout(0).map((path) => path.getBoundingBox().x1));
  const paths = layout(lockup.height + lockup.padding[0] - inkLeft);
  const boxes = paths.map((path) => path.getBoundingBox());
  const box = {
    x1: Math.min(...boxes.map((b) => b.x1)),
    y1: Math.min(...boxes.map((b) => b.y1)),
    x2: Math.max(...boxes.map((b) => b.x2)),
    y2: Math.max(...boxes.map((b) => b.y2)),
  };
  return { paths: paths.map((path) => `<path d="${path.toPathData(3)}"/>`).join(''), box };
}
let lettering: ReturnType<typeof typeset>;

/** the logo in one colour (the diamond keeps its own), framed or as the bare mark and lettering */
function logoSvg(color: string, framed = true) {
  const { height: h, border: b, markSize } = lockup;
  const w = Math.round(lettering.box.x2 + lockup.padding[1] + b);
  const s = markSize / box.size;
  const markArt =
    `<g transform="translate(${h / 2} ${h / 2}) scale(${s}) translate(${-box.cx} ${-box.cy})">` +
    star(color) +
    diamond +
    '</g>';
  // the frame: the outline less the two cells
  const frame =
    `<path fill="${color}" fill-rule="evenodd" d="M0 0H${w}V${h}H0Z` +
    `M${b} ${b}V${h - b}H${h - b}V${b}Z M${h} ${b}V${h - b}H${w - b}V${b}Z"/>`;
  const [mw, mh] = [box.w * s, box.h * s];
  const viewBox = framed
    ? [0, 0, w, h]
    : [
        (h - mw) / 2,
        Math.min((h - mh) / 2, lettering.box.y1),
        lettering.box.x2 - (h - mw) / 2,
        Math.max((h + mh) / 2, lettering.box.y2) - Math.min((h - mh) / 2, lettering.box.y1),
      ];
  return (
    `<!-- Generated by scripts/generate-brand-assets.ts from icon_v3.svg and ${lockup.font.split('/').pop()}: ` +
    'do not edit; change its lockup constants and rerun -->\n' +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox.map((n) => +n.toFixed(3)).join(' ')}">` +
    (framed ? frame : '') +
    markArt +
    `<g fill="${color}">${lettering.paths}</g></svg>\n`
  );
}

/** naktis, `opacity` at (cx, cy), easing to nothing at the ellipse (rx, ry) */
function shadeBehind(w: number, h: number, cx: number, cy: number, rx: number, ry: number, opacity: number) {
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><radialGradient id="s" cx="0" cy="0" r="1" ` +
      `gradientUnits="userSpaceOnUse" gradientTransform="translate(${cx} ${cy}) scale(${rx} ${ry})">` +
      `<stop offset="0" stop-color="#141615" stop-opacity="${opacity}"/>` +
      `<stop offset="0.6" stop-color="#141615" stop-opacity="${opacity / 2}"/>` +
      `<stop offset="1" stop-color="#141615" stop-opacity="0"/></radialGradient></defs>` +
      `<rect width="${w}" height="${h}" fill="url(#s)"/></svg>`
  );
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
