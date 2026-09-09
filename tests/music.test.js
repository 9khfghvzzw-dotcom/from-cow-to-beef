import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
test('complete source solo precedes swing chorus, with independently timed counter-lines',()=>{
 const a=JSON.parse(readFileSync(new URL('../music-source/arrangement.json',import.meta.url)));
 assert.deepEqual(a.sections.map(s=>s.meter),['6/8','4/4 swing 2:1']);
 assert.deepEqual(a.sections.map(s=>s.bars),[48,16]);
 assert.ok(a.peak>0&&a.peak<1);
 const lines=['alto','tenor','bass'].map(v=>a.events.filter(e=>e.voice===v&&e.t<a.sections[1].start));
 for(const line of lines)assert.ok(line.length>50);
 assert.equal(new Set(lines.map(line=>JSON.stringify(line.map(e=>e.t)))).size,3);
 assert.ok(a.events.filter(e=>e.original).length>1000);
 for(const e of a.events){assert.ok(Number.isFinite(e.t)&&e.t>=0);assert.ok(e.d>0);assert.ok(e.p>=0&&e.p<=127);assert.ok(e.t+e.d<=a.duration);}
 const swing=a.events.filter(e=>e.voice==='ride'&&e.t>=a.sections[1].start);
 assert.ok(swing.some(e=>Math.abs(((e.t-a.sections[1].start)/(60/92))%1-2/3)<.001));
});

test('string continuation has 20 minutes of distinct editable sections and four string voices',()=>{
 const a=JSON.parse(readFileSync(new URL('../music-source/strings-score.json',import.meta.url)));
 assert.equal(a.duration,1200);assert.equal(a.sections.reduce((n,s)=>n+s.duration,0),1200);assert.equal(a.sections.length,10);
 assert.equal(new Set(a.sections.map(s=>JSON.stringify(s.events))).size,10);
 for(const s of a.sections){
  assert.equal(new Set(s.events.map(e=>e.voice)).size,4);
  for(const e of s.events){assert.ok(e.t>=0&&e.d>0);assert.ok(e.t+e.d<=120.00001);assert.ok(e.p>=29&&e.p<=88);}
 }
 const c=JSON.parse(readFileSync(new URL('../music-source/music-config.json',import.meta.url)));
 assert.equal(c.insert_at_seconds,660);
});
