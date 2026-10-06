import fs from "node:fs"; import { edit } from "./twinproj-edit.mjs";
const [src, dst] = process.argv.slice(2);
const buf = fs.readFileSync(src); const td = new TextDecoder();
const { scan } = await import("./twinproj-edit.mjs"); const ents = scan(buf);
const sb = buf.subarray(ents["Settings"].cStart + 4, ents["Settings"].cEnd); let settings = td.decode(sb);
let vbRef = `\t\t{\r\n\t\t\t"id": "{F50B82D0-DCAB-43FE-9631-11959D4A4728}",\r\n\t\t\t"isCompilerPackage": true,\r\n\t\t\t"lcid": 0,\r\n\t\t\t"licence": "MIT",\r\n\t\t\t"name": "[COMPILER PACKAGE] twinBASIC - VB Compatibility Package (Forms)",\r\n\t\t\t"path32": "",\r\n\t\t\t"path64": "",\r\n\t\t\t"publisher": "TWINBASIC-COMPILER",\r\n\t\t\t"symbolId": "VB",\r\n\t\t\t"versionBuild": 0,\r\n\t\t\t"versionMajor": 0,\r\n\t\t\t"versionMinor": 0,\r\n\t\t\t"versionRevision": 31\r\n\t\t},\r\n`;
const NL = settings.includes("\r\n") ? "\r\n" : "\n"; vbRefFix();
const anchor = `"project.references": [` + NL; if (!settings.includes(anchor)) throw new Error("settings anchor/EOL mismatch");
if (!settings.includes("F50B82D0")) settings = settings.replace(anchor, anchor + vbRef);
JSON.parse(settings);
function vbRefFix() { vbRef = vbRef.split("\r\n").join(NL); }
const rd = (f) => fs.readFileSync("src/" + f);
const out = edit(buf, { replace: { "Settings": settings }, setDirChildren: { "Sources": [
  ["UI3Button.tbcontrol", rd("UI3Button.tbcontrol")], ["UI3Button.twin", rd("UI3Button.twin")], ["UI3Enums.twin", rd("UI3Enums.twin")] ] } });
fs.writeFileSync(dst, out); console.log("bytes", out.length);
