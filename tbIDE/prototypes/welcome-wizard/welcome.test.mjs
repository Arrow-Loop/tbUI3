/* Node 18+ smoke checks for the isolated welcome wizard.
 * Run: node --test tbIDE/prototypes/welcome-wizard/welcome.test.mjs
 * These validate syntax, exposed API and contractual source restrictions;
 * native IDE integration and visual behavior are acceptance work owned by Cody/Shane.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,join} from 'node:path';
import {Script,createContext} from 'node:vm';
const here=dirname(fileURLToPath(import.meta.url));
const js=readFileSync(join(here,'welcome.js'),'utf8');
const css=readFileSync(join(here,'welcome.css'),'utf8');
const html=readFileSync(join(here,'index.html'),'utf8');
const readme=readFileSync(join(here,'README.md'),'utf8');

test('standalone wizard JavaScript parses and exports the factory',()=>{
  const sandbox={};
  new Script(js,{filename:'welcome.js'}).runInContext(createContext(sandbox));
  assert.equal(typeof sandbox.tbUI3CreateWelcomeWizard,'function');
  assert.throws(()=>sandbox.tbUI3CreateWelcomeWizard(),/requires document, mount and send/);
});
test('six page identifiers and documented public methods exist',()=>{
  for(const page of ['welcome','updates','themes','toolbar','features','finish']) assert.ok(js.includes("'"+page+"'"),page);
  for(const method of ['open','setSnapshot','close','destroy','getState']) assert.match(js,new RegExp(method));
});
test('all native actions conform to the coordination allowlist',()=>{
  for(const action of ['choose-theme','choose-toolbar','installation-preferences','welcome-record','bootstrap-retry','repair-resource']){
    assert.ok(js.includes("'"+action+"'"),action);
    assert.ok(readme.includes(action),action+' must be documented');
  }
  assert.ok(js.includes('new Set('),'allowlist implemented');
  assert.ok(js.includes('pending.add(action)'),'native acknowledgement pending state');
});
test('theme and toolbar choices use native actions and verified native snapshot',()=>{
  assert.ok(js.includes("send('choose-theme',{name:t.name})"));
  assert.ok(js.includes("send('choose-toolbar',{name})"));
  assert.ok(js.includes("snapshot.theme===t.name"));
  assert.ok(js.includes("snapshot.toolbar===name"));
  assert.ok(js.includes("send('welcome-record',{schema:1,disposition})"));
  assert.ok(js.includes("send('repair-resource',{id:r.id,confirmed:true})"));
});
test('CSS is scoped, and preview clearly distinguishes simulation',()=>{
  assert.match(css,/\.tbw-root/);
  assert.doesNotMatch(css,/(^|\n)\s*(?:body|html|:root)\s*\{/);
  assert.match(css,/--color-accent/);
  assert.match(html,/simulated native adapter|simulated acknowledgements|simulated preview/i);
  assert.match(html,/welcome\.js/);
});
test('no direct storage, shell, remote fetch or arbitrary source evaluation',()=>{
  assert.doesNotMatch(js, /\b(?:localStorage|sessionStorage|XMLHttpRequest|fetch|ActiveXObject|eval)\s*\(/);
  assert.doesNotMatch(js, /\b(?:localStorage|sessionStorage)\s*\./);
  assert.doesNotMatch(js, /\binnerHTML\s*=/);
});
