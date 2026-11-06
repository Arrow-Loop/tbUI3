// Replace the Sources folder of a .twinproj with the given files (order as listed), leaving every other entry byte-identical.
// Usage: node build-sources.mjs <in.twinproj> <out.twinproj> <srcDir> <file1> [file2 ...]
import fs from "node:fs"; import path from "node:path"; import { edit } from "./twinproj-edit.mjs";
const [src, dst, dir, ...files] = process.argv.slice(2);
const out = edit(fs.readFileSync(src), { setDirChildren: { "Sources": files.map((f) => [f, fs.readFileSync(path.join(dir, f))]) } });
fs.writeFileSync(dst, out); console.log("bytes", out.length);
