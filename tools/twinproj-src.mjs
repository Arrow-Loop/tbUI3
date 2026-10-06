// Keeps a .twinproj and its src/ mirror in step without the twinBASIC CLI.
//   node tools/twinproj-src.mjs compare <project.twinproj> <srcdir>   lists "same"/"DIFF" per file
//   node tools/twinproj-src.mjs extract <project.twinproj> <srcdir>   writes every file entry into srcdir
//   node tools/twinproj-src.mjs patch   <project.twinproj> <srcdir> <relpath>...   copies the listed src files into the project
// Paths inside the project use forward slashes, e.g. Sources/UI3Button.twin. Untouched entries stay byte-identical.
import fs from "node:fs"; import path from "node:path";
import { scan, edit } from "./twinproj-edit.mjs";
const [cmd, proj, srcdir, ...rels] = process.argv.slice(2);
if (!cmd || !proj || !srcdir) { console.error("usage: compare|extract|patch <project.twinproj> <srcdir> [relpath...]"); process.exit(1); }
const buf = fs.readFileSync(proj);
if (cmd === "patch") {
  const replace = Object.fromEntries(rels.map(r => [r, fs.readFileSync(path.join(srcdir, r))]));
  fs.writeFileSync(proj, edit(buf, { replace }));
} else {
  for (const [p, e] of Object.entries(scan(buf))) if (e.type === "file") {
    const content = buf.subarray(e.cStart + 4, e.cEnd); const f = path.join(srcdir, p);
    if (cmd === "extract") { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, content); }
    else console.log((fs.existsSync(f) && Buffer.compare(fs.readFileSync(f), content) === 0 ? "same" : "DIFF") + " " + p);
  }
}
