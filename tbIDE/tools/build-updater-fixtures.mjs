// Deterministic input fixtures for the compiled engine's -SelfTest mode.
// Node zlib generates RFC 1951 streams; these are data, not a second updater engine.
import fs from 'node:fs';
import zlib from 'node:zlib';
import {createHash} from 'node:crypto';
const crc=b=>{let c=0xffffffff;for(const n of b){c^=n;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;};
function zip(entries){
 const parts=[],central=[];let offset=0;
 for(const e of entries){
  const name=Buffer.from(e.name),raw=Buffer.from(e.text??'abc'),method=e.method??8,body=method===0?raw:zlib.deflateRawSync(raw,e.options),flags=e.flags??0x800;
  const h=Buffer.alloc(30);h.writeUInt32LE(0x04034b50);h.writeUInt16LE(20,4);h.writeUInt16LE(flags,6);h.writeUInt16LE(method,8);h.writeUInt32LE((e.badCrc?123:crc(raw)),14);h.writeUInt32LE(body.length,18);h.writeUInt32LE(e.size??raw.length,22);h.writeUInt16LE(name.length,26);
  const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(0x314,4);c.writeUInt16LE(20,6);c.writeUInt16LE(flags,8);c.writeUInt16LE(method,10);c.writeUInt32LE(e.badCrc?123:crc(raw),16);c.writeUInt32LE(body.length,20);c.writeUInt32LE(e.size??raw.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(e.link?0xa1ff0000:0,38);c.writeUInt32LE(offset,42);
  parts.push(h,name,body);central.push(c,name);offset+=h.length+name.length+body.length;
 }
 const cd=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...parts,cd,end]);
}
const fixtures=[];
function add(name,entries,reject=false,mutate){let archive=zip(entries);if(mutate)archive=mutate(archive);fixtures.push({name,reject,archiveHex:archive.toString('hex'),files:reject?[]:entries.map(e=>({name:e.name,sha256:createHash('sha256').update(e.text??'abc').digest('hex')}))});}
add('stored',[{name:'one.txt',text:'abc',method:0}]);
add('fixed-huffman',[{name:'fixed.txt',text:'hello '.repeat(1400),options:{strategy:zlib.constants.Z_FIXED}}]);
add('dynamic-huffman',[{name:'dynamic.txt',text:Array.from({length:12000},(_,i)=>String.fromCharCode(32+(i*i+i*17)%90)).join('')}]);
add('stored-deflate-block',[{name:'block.txt',text:'native engine test',options:{level:0}}]);
add('empty-file',[{name:'empty.txt',text:''}]);
add('utf8-multi-file',[{name:'nested/caf\u00e9.txt',text:'Unicode filename'},{name:'second.txt',text:'second'}]);
add('history-window',[{name:'history.txt',text:('0123456789'.repeat(4000)+'window history ').repeat(4)}]);
add('parent-traversal',[{name:'../escape.txt'}],true);
add('windows-device',[{name:'NUL.txt'}],true);
add('duplicate-case',[{name:'a.txt'},{name:'A.txt'}],true);
add('archive-link',[{name:'link',link:true}],true);
add('encrypted',[{name:'encrypted',flags:1}],true);
add('unsupported-method',[{name:'method',method:12}],true);
add('crc-mismatch',[{name:'crc',badCrc:true}],true);
add('declared-expansion-limit',[{name:'bomb',size:536870913}],true);
add('truncated-directory',[{name:'broken'}],true,b=>b.subarray(0,b.length-1));
add('zip64-sentinel',[{name:'zip64'}],true,b=>{b.writeUInt16LE(65535,b.length-22+8);b.writeUInt16LE(65535,b.length-22+10);return b;});
add('local-central-mismatch',[{name:'mismatch'}],true,b=>{b.writeUInt16LE(0,8);return b;});
add('invalid-deflate',[{name:'corrupt'}],true,b=>{b[30+Buffer.byteLength('corrupt')]=7;return b;});
fs.writeFileSync('tbIDE/Updater/src/Resources/OTHER/native-engine-fixtures.json',JSON.stringify({schema:1,fixtures})+'\n');
console.log(`Generated ${fixtures.length} compiled-engine ZIP fixtures.`);