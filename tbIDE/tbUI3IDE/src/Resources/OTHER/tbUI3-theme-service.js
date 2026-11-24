// Trusted IDE adapter. Never evaluate theme declarations or activate themes to render previews.
(function createThemeService(env){
 'use strict';
 let pending=false,error='',generation=0,cachedList,cachedThemes=[],completion=null;
 const normalized=value=>String(value||'').trim().toLowerCase();
 function collect(){
  const list=env.themes()||[],seen=new Set(),themes=[];
  const lookup=new Map();
  for(const item of list){const key=normalized(item.name);if(key&&!lookup.has(key))lookup.set(key,item);}
  for(const item of list){
   if(typeof item.name!=='string'||!item.name||item.name.length>160)continue;
   const key=normalized(item.name);if(seen.has(key))continue;seen.add(key);
   const chain=[],visited=new Set();let cursor=item,reason='';
   while(cursor){
    if(visited.has(cursor)||chain.length>=64){reason='Recursive or excessive theme inheritance.';break;}
    visited.add(cursor);
    if(typeof cursor.text!=='string'||cursor.text.length>1048576){reason='Theme text is unavailable or too large.';break;}
    chain.unshift(cursor.text);
    const parent=cursor.text.replace(/\/\*[\s\S]*?\*\//g,'').match(/(?:^|;)\s*inherits\s*:\s*([^;]+);/i);
    const linked=cursor.inheritsFromLink;
    cursor=linked||(parent?lookup.get(normalized(parent[1])):null);
    if(!cursor&&parent&&!linked){reason='Inherited theme is unavailable: '+parent[1].trim();break;}
   }
   themes.push({name:item.name,mode:normalized(item.group),chain,error:reason});
  }
  cachedList=list;cachedThemes=themes;
 }
 function inventory(){
  if(!pending&&(!cachedList||env.themes()!==cachedList))collect();
  return JSON.stringify({themes:cachedThemes,pending,error});
 }
 function refresh(){
  if(pending)return;
  if(!cachedList)collect();
  pending=true;error='';
  const token=++generation,previous=env.afterRefresh();
  const restore=()=>{if(env.afterRefresh()===callback)env.setAfterRefresh(previous);};
  const callback=function(){
   if(token!==generation)return;
   restore();completion=null;
   try{if(typeof previous==='function')previous();collect();}
   catch(e){error=String(e.message||e);}
   finally{pending=false;}
  };
  completion=restore;env.setAfterRefresh(callback);
  try{env.reload();}catch(e){restore();completion=null;pending=false;error=String(e.message||e);}
 }
 function choose(name,id){
  // Discovery and selection are separate. A theme already in the loader inventory
  // does not need another disk reload or asynchronous callback to apply.
  if(pending)throw Error('Theme discovery is still running. Retry shortly.');
  const current=JSON.parse(inventory()).themes;
  if(!current.some(t=>t.name===name))throw Error('Choose an exact name from the current installed-theme inventory.');
  const selected=(env.themes()||[]).find(t=>t.name===name);
  if(!selected)throw Error('The selected installed theme is no longer available.');
  const previous=env.current();let result;
  try{env.setCurrent(selected.name);env.save();env.changed();env.notify();result={requestId:id,ok:true,message:'IDE theme saved.'};}
  catch(e){
   let restoreError='';
   try{env.setCurrent(previous);env.save();env.changed();env.notify();}
   catch(restore){restoreError=' Theme restore needs attention: '+String(restore.message||restore);}
   result={requestId:id,ok:false,message:String(e.message||e)+restoreError};
  }
  return result;
 }
 function timeout(){
  if(!pending)return;
  generation++;if(completion)completion();completion=null;pending=false;
  error='Theme refresh timed out; use Check again to retry.';
 }
 function dispose(){generation++;if(completion)completion();completion=null;pending=false;}
 return {inventory,refresh,choose,timeout,dispose};
})
