// Import only the requested Microsoft Fluent SVGs from a pinned npm package.
// Usage: node tbIDE/tools/import-ribbon-icons.mjs <@fluentui/svg-icons directory>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.argv[2];if(!root)throw Error('Supply the @fluentui/svg-icons package directory');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(pkg.name!=='@fluentui/svg-icons'||pkg.version!=='1.1.341')throw Error('Expected @fluentui/svg-icons 1.1.341');
const dir='tbIDE/tbUI3IDE',code=['js/ribbon-presentation.js','js/ide-toolbar.js'].map(p=>fs.readFileSync(dir+'/'+p,'utf8')).join('\n');
const refs=[...new Set([...code.matchAll(/['"](fluent\/[a-z_]+(?:\/filled)?)['"]/g)].map(m=>m[1]))].sort();
const icons={},sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function load(name,style='regular',onlySize){
    const size=(onlySize?[onlySize]:[24,20,16]).find(n=>fs.existsSync(path.join(root,'icons',`${name}_${n}_${style}.svg`)));
    if(!size)throw Error('Requested icon unavailable: '+name+'/'+style);
    const file=`${name}_${size}_${style}.svg`,svg=fs.readFileSync(path.join(root,'icons',file),'utf8');
    return {svg,file,sha256:sha(svg),source:`https://cdn.jsdelivr.net/npm/@fluentui/svg-icons@${pkg.version}/icons/${file}`};
}
for(const ref of refs){
    const [,name,style]=ref.split('/');
    if(name==='tab_desktop_arrow_right_composite'){
        const left=load('tab_desktop_arrow_left','regular',20),right=load('arrow_circle_right','filled',20);
        const body=s=>s.slice(s.indexOf('>')+1,s.lastIndexOf('</svg>'));
        // Erase the old left-arrow badge, including its alpha, before overlaying
        // the requested filled right-arrow badge at exactly the same center/radius.
        const svg='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">'+
            '<defs><mask id="tab-body"><rect width="20" height="20" fill="white"/><circle cx="5.5" cy="14.5" r="4.6" fill="black"/></mask></defs>'+
            '<g mask="url(#tab-body)">'+body(left.svg)+'</g><g transform="translate(-0.125 8.875) scale(0.5625)">'+body(right.svg)+'</g></svg>';
        icons[ref]={svg,sha256:sha(svg),derived:true,components:[left,right].map(({svg,...meta})=>meta),composition:'Erase original badge; overlay arrow_circle_right_20_filled at (5.5,14.5), radius 4.5.'};
    }else icons[ref]=load(name,style||'regular');
}
fs.writeFileSync(dir+'/icons/requested.json',JSON.stringify({package:pkg.name,version:pkg.version,license:'MIT; Copyright (c) Microsoft Corporation. See fluent/LICENSE.',icons},null,2)+'\n');
console.log(`Imported ${refs.length} requested Fluent assets, including the Page Right composite.`);
