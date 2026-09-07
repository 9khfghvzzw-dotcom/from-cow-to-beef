import test from 'node:test';
import assert from 'node:assert/strict';
import {World,CROPS} from '../src/world.js';
import {tickTeamwork} from '../src/teamwork.js';
const setup=()=>{const w=new World();w.state.xp=2500;w.state.nextWave=1e9;w.state.npcs.forEach(n=>{n.x=0;n.y=0;});return w;};
test('targeted spells require range, fire travels, lightning hits at most four',()=>{
 const w=setup(),s=w.state;s.spellScrolls=['lightning'];w.cast('fire');w.cast('lightning');assert.equal(s.mana,100);assert.deepEqual(s.cooldowns,{});
 const e={id:'e',x:s.player.x+250,y:s.player.y,health:10,maxHealth:10,frozen:0};s.wolves=[e];w.cast('fire');assert.equal(s.mana,72);assert.equal(e.health,10);assert.equal(s.projectiles[0].x,s.player.x+22);w.cast('fire');assert.equal(s.projectiles.length,1);
 for(let i=0;i<10;i++)w.tick(.1);assert.equal(e.health,6);assert.equal(s.projectiles.length,0);
 s.mana=100;s.wolves=Array.from({length:6},(_,i)=>({x:s.player.x+(i===5?400:40+i*20),y:s.player.y,health:10,frozen:0}));w.cast('lightning');assert.deepEqual(s.wolves.map(e=>e.health),[6,6,6,6,10,10]);assert.equal(s.effects.filter(e=>e.kind==='electric').length,4);
});
test('frost reaches near enemies before far enemies and shield lasts 12 seconds',()=>{
 const w=setup(),s=w.state;s.spellScrolls=['sanctuary'];s.wolves=[{x:s.player.x+50,y:s.player.y,frozen:0},{x:s.player.x+300,y:s.player.y,frozen:0}];w.cast('frost');assert.equal(s.wolves[0].frozen,0);w.tick(.25);assert.equal(s.wolves[0].frozen,6);assert.equal(s.wolves[1].frozen,0);for(let i=0;i<4;i++)w.tick(.25);assert.ok(s.wolves[1].frozen>5);
 w.cast('sanctuary');assert.equal(s.sanctuaryUntil-s.time,12);for(let i=0;i<47;i++)w.tick(.25);assert.ok(s.sanctuaryUntil>s.time);w.tick(.25);assert.ok(s.sanctuaryUntil<=s.time);
});
test('rain and bloom produce effects at affected targets',()=>{
 const w=setup(),s=w.state;w.cast('rain');assert.equal(s.crops[0].water,100);assert.ok(s.effects.some(e=>e.kind==='rain-target'&&e.x===s.crops[0].x));s.mana=100;w.cast('bloom');assert.ok(s.effects.some(e=>e.kind==='bloom-target'));
});
test('workers reserve different jobs, split enemies, resume and spend seeds once',()=>{
 const w=setup(),s=w.state;s.cows.forEach(a=>{a.hunger=100;a.thirst=100;});s.animals.forEach(a=>{a.hunger=100;a.thirst=100;});s.crops=[{id:0,x:500,y:500,type:'carrot',growth:100,water:100},{id:1,x:600,y:500,type:'wheat',growth:100,water:100}];
 const a={id:'resident-a',x:500,y:500},b={id:'resident-b',x:600,y:500};s.npcs.push(a,b);tickTeamwork(w,.1,CROPS);assert.equal(s.produce.carrot,3);assert.equal(s.produce.wheat,5);assert.equal(s.harvests,2);
 s.wolves=[{x:510,y:500,health:10},{x:610,y:500,health:10}];tickTeamwork(w,.1,CROPS);assert.deepEqual(s.wolves.map(e=>e.health),[8.5,8.5]);s.wolves=[];s.seeds={carrot:1};a.workCooldown=0;b.workCooldown=0;tickTeamwork(w,.1,CROPS);assert.equal(s.seeds.carrot,0);assert.equal(s.crops.filter(p=>p.type==='carrot').length,1);assert.ok(s.effects.some(e=>e.action==='plant'));
 const copy=new World();assert.ok(copy.load(w.save()));assert.equal(copy.state.seeds.carrot,0);
});
