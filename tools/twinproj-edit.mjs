// Order-preserving .twinproj editor. Keeps every untouched entry byte-identical.
// Operations: replace a file's content; set a top-level directory's children to new files;
// add new files (creating missing folders) at the end of their folder.
import fs from "node:fs";
const MAGIC = 0xea0ba51c;
function scan(buf) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); let pos = 4, n = 0;
  if (v.getUint32(0, true) !== MAGIC) throw new Error("bad magic");
  const u32 = () => { const x = v.getUint32(pos, true); pos += 4; return x; };
  const entries = {};
  function e(prefix) {
    const start = pos; const kind = v.getInt16(pos, true); pos += 2; n++; const isRoot = n === 1;
    const nl = u32(); const name = buf.subarray(pos, pos + nl).toString("utf8"); pos += nl; pos += 13;
    const path = isRoot ? "" : prefix + name;
    if (!isRoot && kind === 1) { const cAt = pos; const cl = u32(); pos += cl; const rc = u32(); pos += 4 * rc;
      entries[path] = { type: "file", start, end: pos, cStart: cAt, cEnd: cAt + 4 + cl }; return; }
    const countAt = pos; const c = u32(); const kidsStart = pos;
    for (let i = 0; i < c; i++) e(isRoot ? "" : path + "/");
    entries[path] = { type: "dir", start, end: pos, countAt, kidsStart };
  }
  e(""); if (pos !== buf.length) throw new Error("trailing bytes"); return entries;
}
const lp = (b) => { const o = Buffer.alloc(4 + b.length); o.writeUInt32LE(b.length, 0); Buffer.from(b).copy(o, 4); return o; };
export function newFileEntry(name, content) {
  const head = Buffer.alloc(2); head.writeInt16LE(1, 0);
  const meta = Buffer.alloc(13); // revision u64 = 0, flags u32 = 0, category u8 = 0 (as in IDE-created seed sources)
  return Buffer.concat([head, lp(Buffer.from(name, "utf8")), meta, lp(Buffer.from(content)), Buffer.alloc(4)]);
}
function newDirEntry(name, children) {
  const head = Buffer.alloc(2); head.writeInt16LE(2, 0);
  const cnt = Buffer.alloc(4); cnt.writeUInt32LE(children.length, 0);
  return Buffer.concat([head, lp(Buffer.from(name, "utf8")), Buffer.alloc(13), cnt, ...children]);
}
// add: { "Resources/OTHER/x.txt": content, ... }. Each new file goes at the end of its folder; a missing
// folder is created (with IDE-default metadata, like the ICON folder) at the end of its parent.
function addEdits(ents, add) {
  const byDir = new Map();
  for (const [p, data] of Object.entries(add)) {
    if (ents[p]) throw new Error("already exists " + p);
    const parts = p.split("/"); let dir = ""; let i = 0;
    while (i < parts.length - 1 && ents[(dir ? dir + "/" : "") + parts[i]]?.type === "dir") { dir = (dir ? dir + "/" : "") + parts[i]; i++; }
    let entry = newFileEntry(parts[parts.length - 1], data);
    for (let j = parts.length - 2; j >= i; j--) entry = newDirEntry(parts[j], [entry]);
    if (!byDir.has(dir)) byDir.set(dir, []);
    byDir.get(dir).push(entry);
  }
  const edits = [];
  for (const [dir, entries] of byDir) {
    const d = ents[dir]; if (!d || d.type !== "dir") throw new Error("no dir " + dir);
    if (dir === "") throw new Error("cannot add at the project root");
    edits.push({ start: d.countAt, end: d.countAt + 4, bytes: (() => { const b = Buffer.alloc(4); b.writeUInt32LE(0, 0); return b; })(), countDelta: entries.length });
    edits.push({ start: d.end, end: d.end, bytes: Buffer.concat(entries) });
  }
  return edits;
}
export function edit(buf, { replace = {}, setDirChildren = {}, add = {} }) {
  const ents = scan(buf); const edits = [];
  for (const [p, data] of Object.entries(replace)) { const f = ents[p]; if (!f || f.type !== "file") throw new Error("no file " + p);
    edits.push({ start: f.cStart, end: f.cEnd, bytes: lp(Buffer.from(data)) }); }
  for (const [p, files] of Object.entries(setDirChildren)) { const d = ents[p]; if (!d || d.type !== "dir") throw new Error("no dir " + p);
    const cnt = Buffer.alloc(4); cnt.writeUInt32LE(files.length, 0);
    edits.push({ start: d.countAt, end: d.end, bytes: Buffer.concat([cnt, ...files.map(([n, c]) => newFileEntry(n, c))]) }); }
  for (const e of addEdits(ents, add)) {
    if (e.countDelta) e.bytes.writeUInt32LE(buf.readUInt32LE(e.start) + e.countDelta, 0);
    edits.push(e);
  }
  edits.sort((a, b) => b.start - a.start || b.end - a.end);
  for (let i = 1; i < edits.length; i++) if (edits[i].end > edits[i - 1].start) throw new Error("overlapping edits");
  let out = Buffer.from(buf); for (const e of edits) out = Buffer.concat([out.subarray(0, e.start), e.bytes, out.subarray(e.end)]);
  return out;
}
export { scan };
