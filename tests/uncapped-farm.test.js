import test from 'node:test';
import assert from 'node:assert/strict';
import {World,CROPS} from '../src/world.js';
import {tickTeamwork} from '../src/teamwork.js';
test('fields continue beyond three with unique reachable plots and persistent inventory',()=>{
 const w=new World(),s=w.state;s.coins=10000;
 for(let i=0;i<12;i++)w.buyFarmUpgrade('land');
 assert.equal(s.landExpansions,12);assert.equal(s.crops.length,78);assert.equal(new Set(s.crops.map(p=>p.id)).size,78);assert.equal(s.coins,8560);
 const p=s.crops.at(-1);assert.ok(w.southBoundary>p.y);s.player.x=p.x;s.player.y=p.y;s.seeds.tea=1;w.plant(p.id,'tea');p.growth=100;w.harvest(p.id);assert.equal(s.produce.tea,CROPS.tea.yield);
 const restored=new World();assert.ok(restored.load(w.save()));assert.equal(restored.state.crops.length,78);
});
test('farmers shear ready sheep automatically once without duplicated wool',()=>{
 const w=new World(),s=w.state,a=s.animals.find(a=>a.kind==='sheep');for(const t of [...s.cows,...s.animals])t.hunger=t.thirst=100;
 a.woolGrowth=100;const farmer=s.npcs.find(n=>n.id==='farmer');farmer.x=a.x;farmer.y=a.y;
 s.npcs.push({id:'resident-test',x:a.x,y:a.y,timer:0});tickTeamwork(w,.1,CROPS);assert.equal(s.wool,3);assert.equal(a.woolGrowth,0);tickTeamwork(w,.1,CROPS);assert.equal(s.wool,3);
});
