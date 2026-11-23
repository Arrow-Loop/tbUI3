// Read fixed PE versions and actual embedded resource bytes without loading/executing the image.
export function readPE(bytes){
 const fail=message=>{throw Error(message);};
 const range=(at,n)=>{if(!Number.isSafeInteger(at)||at<0||at+n>bytes.length)fail('Truncated PE');};
 range(0,64);if(bytes.readUInt16LE(0)!==0x5a4d)fail('Missing MZ header');
 const pe=bytes.readUInt32LE(0x3c);range(pe,24);if(bytes.readUInt32LE(pe)!==0x4550)fail('Missing PE header');
 const machine=bytes.readUInt16LE(pe+4),sectionCount=bytes.readUInt16LE(pe+6),optSize=bytes.readUInt16LE(pe+20),opt=pe+24;range(opt,optSize);
 const magic=bytes.readUInt16LE(opt),dir=opt+(magic===0x10b?96:magic===0x20b?112:fail('Unsupported PE optional header'));
 range(dir,24);const resourceRva=bytes.readUInt32LE(dir+16),resourceSize=bytes.readUInt32LE(dir+20),sections=[];
 for(let i=0;i<sectionCount;i++){const at=opt+optSize+i*40;range(at,40);sections.push({rva:bytes.readUInt32LE(at+12),size:bytes.readUInt32LE(at+16),raw:bytes.readUInt32LE(at+20)});}
 const offset=(rva,size=1)=>{const s=sections.find(s=>rva>=s.rva&&rva+size<=s.rva+s.size);if(!s)fail('PE RVA escapes raw sections');const at=s.raw+rva-s.rva;range(at,size);return at;};
 const resources=new Map();
 if(resourceRva&&resourceSize){
  const base=offset(resourceRva),inside=(relative,n)=>{if(relative<0||relative+n>resourceSize)fail('PE resource escapes directory');const at=base+relative;range(at,n);return at;};
  const label=v=>{if(!(v&0x80000000))return '#'+v;const r=v&0x7fffffff,at=inside(r,2),n=bytes.readUInt16LE(at);inside(r+2,n*2);return bytes.subarray(at+2,at+2+n*2).toString('utf16le');};
  const visit=(relative,names,depth)=>{if(depth>3)fail('PE resource nesting limit');const at=inside(relative,16),count=bytes.readUInt16LE(at+12)+bytes.readUInt16LE(at+14);inside(relative+16,count*8);
   for(let i=0;i<count;i++){const item=at+16+i*8,name=label(bytes.readUInt32LE(item)),child=bytes.readUInt32LE(item+4),next=[...names,name];
    if(child&0x80000000)visit(child&0x7fffffff,next,depth+1);else{const data=inside(child,16),rva=bytes.readUInt32LE(data),size=bytes.readUInt32LE(data+4),start=offset(rva,size),key=next.join('/');if(resources.has(key))fail('Duplicate PE resource');resources.set(key,bytes.subarray(start,start+size));}
   }
  };visit(0,[],0);
 }
 const versions=[...resources].filter(([name])=>name.startsWith('#16/'));
 let version;
 for(const [,data]of versions){const signature=Buffer.from([0xbd,0x04,0xef,0xfe]),at=data.indexOf(signature);if(at>=0&&at+24<=data.length){const ms=data.readUInt32LE(at+8),ls=data.readUInt32LE(at+12),next=[ms>>>16,ms&65535,ls>>>16,ls&65535].join('.');if(version&&version!==next)fail('Conflicting fixed PE versions');version=next;}}
 return {machine,version,resources};
}
export function namedResource(pe,name){
 // twinBASIC uppercases named resources in compiled images; reject differing case/language aliases below.
 const prefixes=['OTHER/'+name+'/', '#10/'+name+'/'].map(p=>p.toUpperCase());
 const found=[...pe.resources].filter(([key])=>prefixes.some(prefix=>key.toUpperCase().startsWith(prefix)));
 if(!found.length)throw Error('Missing embedded PE resource: '+name);
 if(found.some(([,b])=>!b.equals(found[0][1])))throw Error('Resource languages disagree: '+name);
 return found[0][1];
}

// RT_MANIFEST / CREATEPROCESS_MANIFEST_RESOURCE_ID. Inspect bytes, never execute the EXE.
export function requireAsInvokerManifest(pe){
 const manifests=[...pe.resources].filter(([key])=>key.startsWith('#24/#1/'));
 if(!manifests.length)throw Error('Updater requires an embedded #1 application manifest declaring asInvoker; otherwise Windows installer detection can prompt for UAC at startup.');
 for(const [,bytes]of manifests){
  const xml=(bytes[0]===255&&bytes[1]===254?bytes.subarray(2).toString('utf16le'):bytes.toString('utf8')).replace(/<!--[^]*?-->/g,'');
  if(/<!DOCTYPE|<!ENTITY/i.test(xml))throw Error('Unsupported updater application manifest declarations');
  const levels=[...xml.matchAll(/<requestedExecutionLevel\b([^>]*?)\/?\s*>/g)];
  const attribute=(text,name)=>new RegExp('(?:^|\\s)'+name+'\\s*=\\s*(["\x27])([^]*?)\\1').exec(text)?.[2];
  if(levels.length!==1||attribute(levels[0][1],'level')!=='asInvoker'||attribute(levels[0][1],'uiAccess')!=='false')throw Error('Updater application manifest must declare exactly one requestedExecutionLevel asInvoker with uiAccess=false');
 }
}
