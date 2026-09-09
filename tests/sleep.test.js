import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {startSleep,wakeUp,tickHomes,enterHome,furnish} from '../src/homes.js';
import {gameClock} from '../src/encounters.js';
test('sleeping alone outdoors supports every chosen duration and advances normal game time',()=>{
 for(const hours of [6,7,8,9]){
 const w=new World(),s=w.state;s.buildings=[{id:'bed',type:'outdoorBed',health:100,x:s.player.x,y:s.player.y}];s.player.needs={energy:0,food:100,comfort:100,hygiene:100};s.wolves=[];s.nextWave=1e9;s.npcs=s.npcs.filter(n=>!n.id.startsWith('resident-'));assert.equal(s.family.partner,null);assert.ok(startSleep(w,hours,'bed'));assert.equal(startSleep(w,hours,'bed'),false);
 const before=gameClock(s.time).hour;for(let t=0;t<hours*25;t+=.25)w.tick(.25);assert.equal(s.player.homeTask,null);assert.equal(s.player.needs.energy,Math.min(100,hours*12.5));assert.equal(gameClock(s.time).hour,before+hours);
 }
});
test('indoor bed and outdoor bed enforce ownership, proximity and optional early wake',()=>{
 const w=new World(),s=w.state;s.coins=100;s.buildings=[{id:'home',type:'house',x:s.player.x,y:s.player.y,health:100}];assert.ok(enterHome(w,'home'));assert.equal(startSleep(w,8),false);furnish(w,'home','bed');s.player.needs={energy:10,food:100,comfort:100,hygiene:100};assert.ok(startSleep(w,7));tickHomes(w,20);wakeUp(w);assert.equal(s.player.homeTask,null);assert.equal(s.player.needs.energy,20);assert.equal(startSleep(w,0),false);
 s.player.insideHome=null;s.buildings.push({id:'far',type:'outdoorBed',x:9999,y:9999,health:100});assert.equal(startSleep(w,8,'far'),false);
});
test('sleep progress survives reload and a destroyed outdoor bed wakes the player',()=>{
 const w=new World(),s=w.state;s.buildings=[{id:'bed',type:'outdoorBed',x:s.player.x,y:s.player.y,health:100}];startSleep(w,9,'bed');tickHomes(w,10);const restored=new World();assert.ok(restored.load(w.save()));assert.equal(restored.state.player.homeTask.remaining,215);restored.state.buildings[0].health=0;tickHomes(restored,1);assert.equal(restored.state.player.homeTask,null);
});
