// Builds tbIDE/WinUI3IdeStyle/WinUI3IdeStyle.twinproj from its src/ folder, using an IDE add-in sample
// as the container seed (the .twinproj format is binary and only the IDE writes one from scratch).
//   node tbIDE/tools/build-addin-project.mjs "<twinBASIC>\projects\Sample 11.    twinBASIC IDE Addin (Chart)\projectName.twinproj"
// Run from the repository root. Takes the seed's container, renames its root folder, swaps in our
// Settings, .meta and Sources, and drops the sample's icon. After the IDE has saved the project, edit
// src/ and use tools/twinproj-src.mjs patch|add instead, like the other projects in this repository.
import fs from "node:fs"; import path from "node:path";
import { scan, edit } from "../../tools/twinproj-edit.mjs";
const seed = process.argv[2]; if (!seed) { console.error("usage: build-addin-project.mjs <seed.twinproj>"); process.exit(1); }
const name = "WinUI3IdeStyle"; const dir = path.join("tbIDE", name); const src = path.join(dir, "src");
if (fs.existsSync(path.join(dir, name + '.twinproj'))) throw new Error('The canonical project already exists. Use twinproj-src patch/add to preserve its identity and contents.');
let buf = fs.readFileSync(seed); const ents = scan(buf);
const rd = (r) => fs.readFileSync(path.join(src, r));
const sources = fs.readdirSync(path.join(src, "Sources")).sort().map(f => [f, rd("Sources/" + f)]);
buf = edit(buf, { replace: { "Settings": rd("Settings"), ".meta": rd(".meta") },
  setDirChildren: { "Sources": sources }, remove: ents["Resources/ICONS"] ? ["Resources/ICONS"] : [] });
// Root entry: kind (2 bytes), name length (4), name. Rename it to the project name.
const oldLen = buf.readUInt32LE(6); const nb = Buffer.from(name, "utf8"); const len = Buffer.alloc(4); len.writeUInt32LE(nb.length, 0);
buf = Buffer.concat([buf.subarray(0, 6), len, nb, buf.subarray(10 + oldLen)]);
scan(buf); fs.writeFileSync(path.join(dir, name + ".twinproj"), buf); console.log("wrote", path.join(dir, name + ".twinproj"), buf.length, "bytes");
