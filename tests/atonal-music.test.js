import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
test('40-minute plan includes 20 minutes of nonfunctional four-voice chromatic quartet',()=>{
 const a=JSON.parse(readFileSync(new URL('../music-source/atonal-strings-score.json',import.meta.url)));
 const c=JSON.parse(readFileSync(new URL('../music-source/music-config.json',import.meta.url)));
 assert.equal(c.target_duration_seconds+a.duration,2400);assert.equal(c.insert_at_seconds,660);
 assert.equal(a.sections.reduce((n,s)=>n+s.duration,0),1200);
 const ranges={violin1:[60,88],violin2:[55,83],viola:[48,76],cello:[36,64]};
 for(const s of a.sections){
  assert.equal(new Set(s.events.map(e=>e.voice)).size,4);
  for(const [v,[lo,hi]] of Object.entries(ranges)){
   const line=s.events.filter(e=>e.voice===v);assert.equal(new Set(line.map(e=>e.p%12)).size,12);
   for(const phrase of new Set(line.map(e=>e.phrase))){const notes=line.filter(e=>e.phrase===phrase);assert.equal(notes.length,12);assert.equal(new Set(notes.map(e=>e.p%12)).size,12);}
   for(const e of line){assert.ok(e.p>=lo&&e.p<=hi);assert.ok(e.d>0&&e.t>=0&&e.t+e.d<=120.00001);}
  }
  assert.equal(new Set(Object.keys(ranges).map(v=>JSON.stringify(s.events.filter(e=>e.voice===v).map(e=>e.t)))).size,4);
 }
 assert.deepEqual(new Set(a.sections.flatMap(s=>s.events.map(e=>e.articulation))),new Set(['arco','marcato','pizzicato']));
});
