/**
 * Composes the App Store / Play Store screenshots from raw device captures: a caption over the brand colour and
 * the capture inside a device frame, at each store's size. Everything that changes between refreshes (captions,
 * frames, sizes, layout) is in config.json; how to take the captures is in README.md.
 *
 *   pnpm store-screenshots                  every target in config.json
 *   pnpm store-screenshots iOS Android      only these targets
 *
 * Reads scripts/store-screenshots/captures/<target>/<shot>.png and writes each target's `output` pattern.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadSync } from 'opentype.js';
import sharp from 'sharp';

type Frame =
  // a device image whose screen is a transparent hole at `screen` ([x, y, width, height] in the image's pixels)
  | { image: string; screen: [number, number, number, number] }
  // a plain bezel drawn around a screen of `screen` pixels, for devices without an image (Android)
  | { screen: [number, number]; bezel: number; radius: number; color: string; rim: string; camera?: number };

type Target = {
  size: [number, number];
  frame: string;
  output: string;
  // the frame's width on the canvas, and its distance from the bottom edge (negative bleeds off it)
  frameWidth: number;
  frameBottom: number;
  // caption font size and the widest a line may be, in canvas pixels
  captionSize: number;
  captionWidth: number;
};

type Config = {
  background: string;
  captionColor: string;
  font: string;
  lineHeight: number;
  frames: Record<string, Frame>;
  targets: Record<string, Target>;
  shots: { caption: string }[];
};

// run from the repo root, like the other scripts
const root = process.cwd();
const here = join(root, 'scripts/store-screenshots');
const config: Config = JSON.parse(readFileSync(join(here, 'config.json'), 'utf8'));
const font = loadSync(join(root, config.font));

/** the caption as SVG paths (librsvg can't load a font file), wrapped into balanced lines no wider than maxWidth */
function captionSvg(text: string, size: number, maxWidth: number) {
  const width = (line: string) => font.getAdvanceWidth(line, size, { kerning: true });
  const wrap = (limit: number) =>
    text.split('\n').flatMap((paragraph) =>
      paragraph.split(' ').reduce<string[]>((lines, word) => {
        const last = lines.at(-1);
        if (last !== undefined && width(`${last} ${word}`) <= limit) lines[lines.length - 1] = `${last} ${word}`;
        else lines.push(word);
        return lines;
      }, [])
    );
  // greedy wrapping leaves a short last line: shrink the limit while the line count holds
  const count = wrap(maxWidth).length;
  let limit = maxWidth;
  while (limit > size && wrap(limit - size / 4).length === count) limit -= size / 4;
  const lines = wrap(limit);

  const lineHeight = size * config.lineHeight;
  const ascent = (font.ascender / font.unitsPerEm) * size;
  const descent = (-font.descender / font.unitsPerEm) * size;
  const height = Math.ceil(lineHeight * (lines.length - 1) + ascent + descent);
  const paths = lines.map((line, i) =>
    font.getPath(line, (maxWidth - width(line)) / 2, ascent + i * lineHeight, size, { kerning: true }).toPathData(2)
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${maxWidth}" height="${height}">
    <path fill="${config.captionColor}" d="${paths.join(' ')}"/></svg>`;
  return { svg: Buffer.from(svg), height };
}

/** the frame with the capture in its screen, as a PNG at the frame's native size */
async function framed(frame: Frame, capture: string) {
  if ('image' in frame) {
    const [x, y, w, h] = frame.screen;
    const image = sharp(join(root, frame.image));
    const { width, height } = await image.metadata();
    const screen = await sharp(capture).resize(w, h, { fit: 'fill' }).toBuffer();
    return sharp({ create: { width, height, channels: 4, background: '#0000' } })
      .composite([{ input: screen, left: x, top: y }, { input: join(root, frame.image) }])
      .png()
      .toBuffer();
  }
  const [w, h] = frame.screen;
  const { bezel: b, radius: r } = frame;
  const width = w + 2 * b;
  const height = h + 2 * b;
  const screen = await sharp(capture).resize(w, h, { fit: 'fill' }).toBuffer();
  const camera = frame.camera
    ? `<circle cx="${width / 2}" cy="${b + frame.camera * 2.2}" r="${frame.camera}" fill="${frame.color}"/>`
    : '';
  // the bezel is a rounded rect with a rim, masked so the capture shows through the screen
  const rim = Math.round(b / 6);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <mask id="screen"><rect width="${width}" height="${height}" fill="#fff"/>
      <rect x="${b}" y="${b}" width="${w}" height="${h}" rx="${r}" fill="#000"/></mask>
    <rect x="${rim / 2}" y="${rim / 2}" width="${width - rim}" height="${height - rim}" rx="${r + b - rim / 2}"
      fill="${frame.color}" stroke="${frame.rim}" stroke-width="${rim}" mask="url(#screen)"/>
    ${camera}</svg>`;
  return sharp({ create: { width, height, channels: 4, background: '#0000' } })
    .composite([{ input: screen, left: b, top: b }, { input: Buffer.from(svg) }])
    .png()
    .toBuffer();
}

async function compose(name: string, target: Target) {
  const [canvasWidth, canvasHeight] = target.size;
  for (const [index, shot] of config.shots.entries()) {
    const capture = join(here, 'captures', name, `${index + 1}.png`);
    if (!existsSync(capture)) {
      console.warn(`skipped ${name} ${index + 1}: no capture at ${capture}`);
      continue;
    }
    const device = await sharp(await framed(config.frames[target.frame], capture))
      .resize({ width: target.frameWidth })
      .toBuffer();
    const deviceHeight = (await sharp(device).metadata()).height;
    const deviceTop = canvasHeight - target.frameBottom - deviceHeight;
    const caption = captionSvg(shot.caption, target.captionSize, target.captionWidth);

    const output = join(root, target.output.replace('{n}', String(index + 1)));
    await sharp({ create: { width: canvasWidth, height: canvasHeight, channels: 3, background: config.background } })
      .composite([
        {
          input: caption.svg,
          left: Math.round((canvasWidth - target.captionWidth) / 2),
          top: Math.round((deviceTop - caption.height) / 2),
        },
        // a frame that bleeds off the bottom is cropped to the canvas
        {
          input: await sharp(device)
            .extract({
              left: 0,
              top: 0,
              width: target.frameWidth,
              height: Math.min(deviceHeight, canvasHeight - deviceTop),
            })
            .toBuffer(),
          left: Math.round((canvasWidth - target.frameWidth) / 2),
          top: deviceTop,
        },
      ])
      .png()
      .toFile(output);
    console.log(`wrote ${output}`);
  }
}

async function main() {
  const only = process.argv.slice(2);
  for (const [name, target] of Object.entries(config.targets)) {
    if (only.length === 0 || only.includes(name)) await compose(name, target);
  }
}

main();
