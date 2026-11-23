// Trusted IDE adapter only. Theme text never enters the Wizard document.
(function createThemeService(env){
 'use strict';
 let pending=false,error='',generation=0,cachedList,cached='';
 function inventory(){
  const list=env.themes();
  if(pending||error)return JSON.stringify({themes:[],pending,error});
  if(list===cachedList&&cached)return cached;
  const seen=new Set(),themes=[];
  for(const item of list||[]){
   if(typeof item.name!=='string'||!item.name||item.name.length>160)continue;
   const key=item.name.toLowerCase();if(seen.has(key))continue;seen.add(key);
   const chain=[],visited=new Set();let cursor=item,reason='';
   while(cursor){
    if(visited.has(cursor)||chain.length>=64){reason='Recursive or excessive theme inheritance.';break;}
    visited.add(cursor);
    if(typeof cursor.text!=='string'||cursor.text.length>1048576){reason='Theme text is unavailable or too large.';break;}
    chain.unshift(cursor.text);cursor=cursor.inheritsFromLink;
   }
   themes.push({name:item.name,mode:String(item.group||'').toLowerCase(),chain,error:reason});
  }
  cachedList=list;cached=JSON.stringify({themes,pending:false,error});return cached;
 }
 function refresh(done){
  if(pending){if(done)throw Error('Theme discovery is still running. Retry shortly.');return;}
  pending=true;cachedList=null;cached='';error='';
  const token=++generation,previous=env.afterRefresh();
  env.setAfterRefresh(function(){
   try{if(typeof previous==='function')previous();}finally{
    if(token===generation){pending=false;cachedList=null;if(done)done();}
   }
  });
  try{env.reload();}catch(e){pending=false;error=String(e.message||e);if(done)throw e;}
 }
 function choose(name,id){
  const current=JSON.parse(inventory()).themes;
  if(!current.some(t=>t.name===name))throw Error('Choose an exact name from the current installed-theme inventory.');
  env.result(null);
  refresh(()=>{
   if(env.pendingId()!==id)return;
   env.setPendingId(null);
   const selected=env.themes().find(t=>String(t.name).toLowerCase()===name.toLowerCase());
   if(!selected){env.result({requestId:id,ok:false,message:'The selected installed theme disappeared during refresh.'});return;}
   const previous=env.current();
   try{env.setCurrent(selected.name);env.save();env.changed();env.notify();env.result({requestId:id,ok:true,message:'IDE theme saved.'});}
   catch(e){
    try{env.setCurrent(previous);env.save();env.changed();env.notify();}catch(restore){error='Theme restore needs attention: '+String(restore.message||restore);}
    env.result({requestId:id,ok:false,message:String(e.message||e)+(error?' '+error:'')});
   }
  });
 }
 function timeout(){if(pending){generation++;pending=false;cachedList=null;error='Theme refresh timed out; use Check again to retry.';}}
 return {inventory,refresh,choose,timeout};
})
