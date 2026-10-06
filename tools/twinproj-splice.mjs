// Order-preserving .twinproj patcher: replaces root name and selected file contents in place,
// leaving every other byte (entry order, revisions, flags, .meta) untouched.
import fs from "node:fs";
const MAGIC = 0xea0ba51c;
export function index(buf) {
  const v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength); let pos = 0, n = 0;
  const u32 = () => { const x = v.getUint32(pos, true); pos += 4; return x; };
  if (u32() !== MAGIC) throw new Error("bad magic");
  const files = {}; let root = null;
  function entry(prefix) {
    const kind = v.getInt16(pos, true); pos += 2; n++; const isRoot = n === 1;
    const nameAt = pos; const nl = u32(); const name = new TextDecoder().decode(buf.subarray(pos, pos + nl)); pos += nl;
    pos += 8 + 4 + 1;
    if (isRoot) root = { name, start: nameAt, end: nameAt + 4 + nl };
    if (!isRoot && kind === 1) {
      const cAt = pos; const cl = u32(); const content = buf.subarray(pos, pos + cl); pos += cl;
      const rc = u32(); pos += 4 * rc;
      files[prefix + name] = { start: cAt, end: cAt + 4 + cl, content };
      return;
    }
    const cnt = u32(); const p = isRoot ? "" : prefix + name + "/";
    for (let i = 0; i < cnt; i++) entry(p);
  }
  entry("");
  if (pos !== buf.length) throw new Error("trailing bytes " + (buf.length - pos));
  return { root, files };
}
const lenPrefixed = (bytes) => { const o = Buffer.alloc(4 + bytes.length); o.writeUInt32LE(bytes.length, 0); Buffer.from(bytes).copy(o, 4); return o; };
export function patch(buf, { rootName, replace = {} }) {
  const { root, files } = index(buf); const edits = [];
  if (rootName) edits.push({ ...root, bytes: lenPrefixed(Buffer.from(rootName, "utf8")) });
  for (const [p, data] of Object.entries(replace)) {
    if (!files[p]) throw new Error("no such file " + p);
    edits.push({ ...files[p], bytes: lenPrefixed(Buffer.from(data)) });
  }
  edits.sort((a, b) => b.start - a.start); let out = Buffer.from(buf);
  for (const e of edits) out = Buffer.concat([out.subarray(0, e.start), e.bytes, out.subarray(e.end)]);
  return out;
}
