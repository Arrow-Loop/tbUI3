#!/usr/bin/env node
// Regenerates the Segoe Fluent icon enum and catalog in the tbUI3 sources from
// docs/research/data/segoe-fluent-icons.json (the WinUI Gallery's Iconography data).
//
//   node tools/gen-icons.mjs
//
// Rewrites only the text between the <generated:...> marker comments in
// tbUI3/src/Sources/UI3Enums.twin (UI3Icon) and tbUI3/src/Sources/UI3Icons.twin (CatalogData).
// Output uses CRLF like the rest of the .twin sources. Afterwards, patch the .twinproj:
//   node tools/twinproj-src.mjs patch tbUI3/tbUI3.twinproj tbUI3/src Sources/UI3Enums.twin Sources/UI3Icons.twin

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'docs/research/data/segoe-fluent-icons.json'), 'utf8'));
const CRLF = '\r\n';

const icons = data.icons
  .map(i => ({ name: i.name, code: i.code.toUpperCase(), fluentOnly: !!i.fluentOnly, tags: i.tags || [] }))
  .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

const seen = new Set();
for (const i of icons) {
  if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(i.name)) throw new Error(`Not an identifier: ${i.name}`);
  const key = i.name.toLowerCase();
  if (seen.has(key)) throw new Error(`Duplicate name: ${i.name}`);
  if (key === 'none') throw new Error('A glyph named None would clash with ui3IconNone');
  seen.add(key);
  if (!/^[0-9A-F]{4}$/.test(i.code)) throw new Error(`Unexpected code for ${i.name}: ${i.code}`);
}

// Tags go into a "|"- and ";"-separated string literal: keep printable ASCII tags without
// separators or quotes (a handful of single-symbol tags such as a multiplication sign are dropped).
const cleanTags = tags => [...new Set(tags
  .map(t => t.trim().replace(/\s+/g, ' '))
  .filter(t => t.length > 0 && /^[\x20-\x7E]+$/.test(t) && !/[|;"]/.test(t)))].join(' ');

const src = data.source;
const sourceLine = `${src.repository} commit ${src.commit}, ${src.fontPath} (MIT)`;

const enumLines = [
  `    ' <generated:UI3Icon> Written by tools/gen-icons.mjs; do not edit by hand.`,
  `    ' Every glyph the WinUI Gallery lists for Segoe Fluent Icons (${icons.length}), named as the Gallery`,
  `    ' names it. A value is the glyph's code point, as in WinUI's FontIcon.Glyph.`,
  `    ' Source: ${sourceLine}.`,
  `    [Description("Segoe Fluent Icons glyph. Values are the glyph code points, as in WinUI's FontIcon.Glyph.")]`,
  `    Public Enum UI3Icon`,
  `        ui3IconNone = 0`,
  ...icons.map(i => `        ui3Icon${i.name} = &H${i.code}&`),
  `    End Enum`,
  `    ' </generated:UI3Icon>`,
];

const entries = icons.map(i => `${i.name}|${i.code}|${i.fluentOnly ? 'F' : ''}|${cleanTags(i.tags)};`);
const dataLines = [];
let line = '';
for (const e of entries) {
  if (line.length + e.length > 160 && line.length > 0) { dataLines.push(line); line = ''; }
  line += e;
}
if (line) dataLines.push(line);

const catalogLines = [
  `    ' <generated:CatalogData> Written by tools/gen-icons.mjs; do not edit by hand.`,
  `    ' Name|Code|F when Fluent only|tags;  Source: ${sourceLine}.`,
  `    Private Sub CatalogData(ByRef s As String)`,
  ...dataLines.map(l => `        s = s & "${l}"`),
  `    End Sub`,
  `    ' </generated:CatalogData>`,
];

function replaceRegion(file, tag, lines) {
  const path = join(root, file);
  const text = readFileSync(path, 'utf8');
  const start = text.indexOf(`' <generated:${tag}>`);
  const endMarker = `' </generated:${tag}>`;
  const end = text.indexOf(endMarker);
  if (start < 0 || end < 0) throw new Error(`Markers for ${tag} not found in ${file}`);
  const lineStart = text.lastIndexOf('\n', start) + 1;
  const lineEnd = text.indexOf('\n', end) + 1;
  writeFileSync(path, text.slice(0, lineStart) + lines.join(CRLF) + CRLF + text.slice(lineEnd));
}

replaceRegion('tbUI3/src/Sources/UI3Enums.twin', 'UI3Icon', enumLines);
replaceRegion('tbUI3/src/Sources/UI3Icons.twin', 'CatalogData', catalogLines);
console.log(`Generated ${icons.length} icons (${icons.filter(i => i.fluentOnly).length} Fluent only).`);
