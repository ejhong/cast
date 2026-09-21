import assert from 'node:assert/strict';
import {readFile,stat,readdir} from 'node:fs/promises';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {sources} from '../shared/sources.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const ids=JSON.parse(await readFile(resolve(root,'tests/index.json'),'utf8'));
assert.ok(ids.length);assert.equal(new Set(ids).size,ids.length);
const pages=['index.html'];
for(const id of ids){
  assert.match(id,/^[a-z0-9-]+$/);const dir=resolve(root,'tests',id),s=JSON.parse(await readFile(resolve(dir,'study.json'),'utf8'));
  for(const key of ['title','shortTitle','summary','sceneDescription','modelNote','hypothesis','alternative','test'])assert.ok(s[key]?.trim(),`${id}: missing ${key}`);
  assert.equal(s.steps.length,5,`${id}: five timeline stages required`);assert.ok(s.initial>=0&&s.initial<=1);assert.ok(s.duration>0);
  for(const source of s.sources)assert.ok(sources[source],`${id}: unknown source ${source}`);
  if(s.caseStudy)assert.ok(sources[s.caseStudy.source],`${id}: unknown case source`);
  if(s.scenarios){
    assert.equal(new Set(s.scenarios.map(v=>v.id)).size,s.scenarios.length,`${id}: duplicate scenarios`);
    for(const scenario of s.scenarios){assert.ok(scenario.id&&scenario.label&&scenario.description);if(scenario.steps)assert.equal(scenario.steps.length,5);}
  }
  for(const file of ['scene.js','index.html'])await stat(resolve(dir,file));
  assert.ok((await stat(resolve(root,'assets/previews',`${id}.png`))).size>10000,`${id}: missing or empty poster`);
  pages.push(`tests/${id}/index.html`);
}
for(const page of pages){
  const path=resolve(root,page),html=await readFile(path,'utf8');
  assert.match(html,/<title>/);assert.match(html,/<h1[ >]/);assert.match(html,/<html lang="en">/);
  for(const [,link]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|data:|#)/.test(link))continue;
    const [relative,hash]=link.split('#');let target=resolve(dirname(path),relative);
    if((await stat(target)).isDirectory())target=resolve(target,'index.html');
    if(hash&&extname(target)==='.html'){const dest=await readFile(target,'utf8');assert.ok(dest.includes(`id="${hash}"`),`${page}: broken anchor ${link}`);}
  }
}
for(const folder of ['shared','tests','scripts','checks']){
  async function walk(dir){for(const entry of await readdir(dir,{withFileTypes:true})){const file=resolve(dir,entry.name);if(entry.isDirectory())await walk(file);else if(/\.(m?js)$/.test(file)){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);}}}
  await walk(resolve(root,folder));
}
console.log(`Checked ${pages.length} pages, ${ids.length} study records and previews, local links, anchors, sources, and JavaScript syntax.`);
