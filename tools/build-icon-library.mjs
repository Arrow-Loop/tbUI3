#!/usr/bin/env node
// Builds the per-PC icon library that the tbUI3 icon picker installs from its Setup tab.
//
//   node tools/build-icon-library.mjs --fluent <fluentui-system-icons checkout>
//        --gallery <WinUI-Gallery checkout> --version 2026.10.19.1 --out <folder>
//
// Inputs are checkouts of microsoft/fluentui-system-icons (assets/**/*.svg and
// assets/*/metadata.json) and microsoft/WinUI-Gallery (WinUIGallery/Assets/ControlImages/*.png),
// each at the commit recorded in the output. Segoe Fluent glyphs are not included: they come
// from the installed font and the UI3Icon enum (tools/gen-icons.mjs).
//
// Writes to --out:
//   tbUI3-Icons.dat              the library (format below), installed to %LOCALAPPDATA%\tbUI3
//   tbUI3-Icons-<version>.zip    tbUI3-Icons.dat plus NOTICE.txt, the release download
//   manifest.txt                 key=value lines the picker reads to offer an update
//
// tbUI3-Icons.dat (little-endian; every number is a 32-bit signed Long so twinBASIC can Get it):
//   0   8 bytes  "tbUI3LIB"
//   8   Long     format version (1)
//   12  Long     entry count
//   16  Long     index offset        20  Long  index length in bytes
//   24  Long     data offset         28  Long  data length in bytes
//   32  index    ASCII text, CRLF lines. First line: "#tbUI3-Icons|<version>|<fluent commit>|<gallery commit>"
//                then one line per entry: set|id|name|style|size|variant|tags|offset|length
//                set F = Fluent UI System SVG, G = WinUI Gallery PNG; id is the file's own name (ic_fluent_<id>_...
//                or the PNG's base name; a few Fluent folders hold a second id); offset is relative to the data offset;
//                tags are space-separated; variant is a locale folder (ar, he, ...) or ltr/rtl.
//   data     the SVG and PNG files' bytes, unchanged, one after another.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { deflateRawSync, crc32 } from 'node:zlib';

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, '')] = process.argv[i + 1];
for (const k of ['fluent', 'gallery', 'version', 'out']) if (!args[k]) throw new Error(`Missing --${k}`);
if (!/^\d{4}\.\d{1,2}\.\d{1,2}\.\d+$/.test(args.version)) throw new Error('Version must look like 2026.10.19.1');

const CRLF = '\r\n';
const commitOf = dir => execFileSync('git', ['-C', dir, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
// The index is split on "|", ";" is reserved, and the picker reads it as ASCII.
const clean = s => String(s).trim().replace(/\s+/g, ' ');
const okText = s => s.length > 0 && /^[\x20-\x7E]+$/.test(s) && !/[|;"]/.test(s);
const cleanTags = tags => [...new Set((tags || []).map(clean).filter(okText))].join(' ');

const entries = [];

// Fluent UI System Icons: assets/<Name>/[<locale>/]SVG/ic_fluent_<id>_<size>_<style>[_ltr|_rtl].svg
const fluentAssets = join(args.fluent, 'assets');
for (const folder of readdirSync(fluentAssets).sort()) {
  const dir = join(fluentAssets, folder);
  if (!statSync(dir).isDirectory()) continue;
  if (!okText(folder)) throw new Error(`Unexpected icon folder name: ${folder}`);
  const metaPath = join(dir, 'metadata.json');
  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf8')) : {};
  const tags = cleanTags(meta.metaphor);
  const svgDirs = [['', join(dir, 'SVG')]];
  for (const sub of readdirSync(dir)) if (sub !== 'SVG' && existsSync(join(dir, sub, 'SVG'))) svgDirs.push([sub, join(dir, sub, 'SVG')]);
  for (const [locale, svgDir] of svgDirs) {
    if (!existsSync(svgDir)) continue;
    for (const file of readdirSync(svgDir).sort()) {
      const m = /^ic_fluent_([a-z0-9_]+?)_(\d+)_(filled|regular|color|light)(?:_(ltr|rtl))?\.svg$/.exec(file);
      if (!m) throw new Error(`Unexpected SVG name: ${folder}/${file}`);
      entries.push({ set: 'F', id: m[1], name: folder, style: m[3], size: +m[2], variant: locale || m[4] || '', tags,
                     bytes: readFileSync(join(svgDir, file)) });
    }
  }
}

// WinUI Gallery control images.
const galleryDir = join(args.gallery, 'WinUIGallery/Assets/ControlImages');
for (const file of readdirSync(galleryDir).sort()) {
  if (!file.toLowerCase().endsWith('.png')) continue;
  const name = basename(file, '.png');
  if (!okText(name)) throw new Error(`Unexpected image name: ${file}`);
  const bytes = readFileSync(join(galleryDir, file));
  entries.push({ set: 'G', id: name, name, style: '', size: bytes.readUInt32BE(16), variant: '', tags: 'Gallery', bytes });
}

const styleOrder = { regular: 0, filled: 1, light: 2, color: 3, '': 4 };
entries.sort((a, b) => a.set.localeCompare(b.set) || a.name.toLowerCase().localeCompare(b.name.toLowerCase()) || a.id.localeCompare(b.id)
  || styleOrder[a.style] - styleOrder[b.style] || a.size - b.size || a.variant.localeCompare(b.variant));

const seen = new Set();
let offset = 0;
const lines = [`#tbUI3-Icons|${args.version}|${commitOf(args.fluent)}|${commitOf(args.gallery)}`];
for (const e of entries) {
  const key = `${e.set}|${e.id}|${e.style}|${e.size}|${e.variant}`.toLowerCase();
  if (seen.has(key)) throw new Error(`Duplicate entry: ${key}`);
  seen.add(key);
  lines.push(`${e.set}|${e.id}|${e.name}|${e.style}|${e.size}|${e.variant}|${e.tags}|${offset}|${e.bytes.length}`);
  offset += e.bytes.length;
}
const index = Buffer.from(lines.join(CRLF) + CRLF, 'ascii');
const data = Buffer.concat(entries.map(e => e.bytes));

const header = Buffer.alloc(32);
header.write('tbUI3LIB', 0, 'ascii');
header.writeInt32LE(1, 8);
header.writeInt32LE(entries.length, 12);
header.writeInt32LE(32, 16);
header.writeInt32LE(index.length, 20);
header.writeInt32LE(32 + index.length, 24);
header.writeInt32LE(data.length, 28);
const dat = Buffer.concat([header, index, data]);
if (dat.length > 0x7fffffff) throw new Error('Library too large for 32-bit offsets');

const notice = [
  `tbUI3 icon library ${args.version}`,
  '',
  'Fluent UI System Icons: https://github.com/microsoft/fluentui-system-icons',
  `commit ${commitOf(args.fluent)}`,
  '',
  readFileSync(join(args.fluent, 'LICENSE'), 'utf8').trim(),
  '',
  'WinUI Gallery control images: https://github.com/microsoft/WinUI-Gallery (WinUIGallery/Assets/ControlImages)',
  `commit ${commitOf(args.gallery)}`,
  '',
  readFileSync(join(args.gallery, 'LICENSE'), 'utf8').replace(/^ {4}/gm, '').trim(),
  '',
].join(CRLF);

// A minimal deflate zip, so the build needs nothing beyond Node. Windows' tar extracts it.
// Fixed timestamps keep the zip byte-identical for identical inputs.
function zip(files) {
  const locals = [], centrals = [];
  let pos = 0;
  const DOS_TIME = 0, DOS_DATE = (2026 - 1980) << 9 | 1 << 5 | 1;
  for (const [name, content] of files) {
    const nameBuf = Buffer.from(name, 'ascii');
    const packed = deflateRawSync(content, { level: 9 });
    const crc = crc32(content);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6);
    local.writeUInt16LE(8, 8); local.writeUInt16LE(DOS_TIME, 10); local.writeUInt16LE(DOS_DATE, 12);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(packed.length, 18); local.writeUInt32LE(content.length, 22);
    local.writeUInt16LE(nameBuf.length, 26); local.writeUInt16LE(0, 28);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0, 8); central.writeUInt16LE(8, 10); central.writeUInt16LE(DOS_TIME, 12);
    central.writeUInt16LE(DOS_DATE, 14); central.writeUInt32LE(crc, 16); central.writeUInt32LE(packed.length, 20);
    central.writeUInt32LE(content.length, 24); central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(pos, 42);
    locals.push(local, nameBuf, packed);
    centrals.push(central, nameBuf);
    pos += 30 + nameBuf.length + packed.length;
  }
  const cd = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(pos, 16);
  return Buffer.concat([...locals, cd, end]);
}

const zipName = `tbUI3-Icons-${args.version}.zip`;
const zipped = zip([['tbUI3-Icons.dat', dat], ['NOTICE.txt', Buffer.from(notice, 'utf8')]]);
const sha = b => createHash('sha256').update(b).digest('hex');

const manifest = [
  'library=tbUI3-Icons',
  'format=1',
  `version=${args.version}`,
  `file=${zipName}`,
  `size=${zipped.length}`,
  `sha256=${sha(zipped)}`,
  `datSize=${dat.length}`,
  `datSha256=${sha(dat)}`,
  `entries=${entries.length}`,
  `fluentCommit=${commitOf(args.fluent)}`,
  `galleryCommit=${commitOf(args.gallery)}`,
  '',
].join(CRLF);

mkdirSync(args.out, { recursive: true });
writeFileSync(join(args.out, 'tbUI3-Icons.dat'), dat);
writeFileSync(join(args.out, zipName), zipped);
writeFileSync(join(args.out, 'manifest.txt'), manifest);

const count = (set, style) => entries.filter(e => e.set === set && (style === undefined || e.style === style)).length;
console.log(`${entries.length} entries: Fluent ${count('F')} (regular ${count('F', 'regular')}, filled ${count('F', 'filled')}, ` +
  `color ${count('F', 'color')}, light ${count('F', 'light')}), Gallery ${count('G')}`);
console.log(`tbUI3-Icons.dat ${dat.length} bytes, ${zipName} ${zipped.length} bytes`);
