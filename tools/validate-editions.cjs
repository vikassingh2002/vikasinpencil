/* Run with Node from any directory before publishing a Monday issue. */
const fs=require('fs'),path=require('path'),vm=require('vm'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');const ctx={};ctx.window=ctx;vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'content/ai-articles.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'assets/js/agentic-art.js'),'utf8'),ctx);
const data=ctx.NB.aiArticles,media=ctx.AgenticArt.manifest,ids=new Set(),hashes=new Map();
function check(ok,msg){if(!ok)throw Error(msg)}
const issues=new Set();
for(const e of data.editions){
 check(!issues.has(e.id),'Duplicate edition '+e.id);issues.add(e.id);
 check(new Date(e.date+'T00:00:00Z').getUTCDay()===1,'Edition must be dated Monday: '+e.id);
 check(e.coverageStart<=e.coverageEnd&&e.coverageEnd<=e.date,'Invalid coverage window '+e.id);
 check(fs.existsSync(path.join(root,e.cover)),'Missing cover '+e.id);
 check(e.articleIds.length===new Set(e.articleIds).size,'Duplicate membership '+e.id);
 check(e.articleIds.includes(e.leadId),'Lead not in edition '+e.id);
 for(const id of e.articleIds){const a=data.articles.find(a=>a.id===id);check(a,'Missing article '+id);check(a.editionId===e.id,'Wrong article issue '+id);check(a.date>=e.coverageStart&&a.date<=e.coverageEnd,'Dateline outside issue '+id);check(a.sources.length>0,'No sources '+id);check(a.sources.every(s=>s.date<=e.coverageEnd),'Post-cutoff source '+id);}
}
check(issues.has(data.currentEdition),'Current issue not found');
for(const e of data.editions){check(e.briefIds.length>=6&&e.briefIds.length<=7,'Digest must have six or seven updates');check(e.briefIds.every(id=>data.briefs.some(b=>b.id===id)),'Missing digest entry');check(e.chunkIds.every(id=>e.articleIds.includes(id)),'Short read outside edition');}
for(const a of data.articles){
 check(!ids.has(a.id),'Duplicate article '+a.id);ids.add(a.id);check(media[a.id],'Missing image '+a.id);
 const file=path.join(root,'assets/img/editorial',media[a.id][0]+'.jpg');check(fs.existsSync(file),'Missing image file '+file);
 const hash=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');check(!hashes.has(hash),'Image reused by '+a.id+' and '+hashes.get(hash));hashes.set(hash,a.id);
 check(a.body.filter(p=>typeof p==='string').join(' ').split(/\s+/).length>=(a.format==='long-read'?850:250),'Article too short for its format '+a.id);
}
for(const b of data.briefs){const a=data.articles.find(a=>a.id===b.articleId);check(a,'Orphan brief '+b.id);const e=data.editions.find(e=>e.id===a.editionId);check(b.date>=e.coverageStart&&b.date<=e.coverageEnd,'Brief outside issue '+b.id)}
console.log('Valid: '+data.editions.length+' Monday issue(s), '+ids.size+' articles, '+hashes.size+' different image hashes.');
