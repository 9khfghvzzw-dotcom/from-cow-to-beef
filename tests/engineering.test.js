import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
const advance=(w,n)=>{for(let i=0;i<n*4;i++)w.tick(.25);};
function setup(){const w=new World({random:()=>.5});w.state.coins=3000;w.state.nextWave=1e9;w.buyEngineering('guardian');w.buyEngineering('screwdriver');w.state.player.x=w.state.guards[0].x;w.state.player.y=w.state.guards[0].y;return w;}
test('guardian purchase checks funds, caps roster and never charges for duplicate tools',()=>{
 const w=new World();w.buyEngineering('guardian');assert.equal(w.state.guards.length,0);assert.match(w.state.notices[0].text,/300 more gold to buy Voltwarden/);
 w.state.coins=5000;for(let i=0;i<5;i++)w.buyEngineering('guardian');assert.equal(w.state.guards.length,4);assert.equal(w.state.coins,3400);
 w.buyEngineering('screwdriver');const balance=w.state.coins;w.buyEngineering('screwdriver');assert.equal(w.state.coins,balance);
});
test('electric guard attacks wolves and survives damage; zero armor disables firing',()=>{
 const w=setup(),s=w.state,g=s.guards[0];s.npcs[1].x=200;s.npcs[1].y=200;
 s.wolves=[{x:g.x+10,y:g.y,frozen:0,retreat:0}];g.lastShot=0;w.tick(.25);assert.ok(g.health<240);
 advance(w,5);assert.equal(s.wolves.length,0);assert.ok(s.effects.some(e=>e.kind==='electric')||g.lastShot>0);assert.equal(s.xp,20);
 g.health=0;s.wolves=[{x:g.x+80,y:g.y,frozen:0,retreat:0}];const shot=g.lastShot;advance(w,3);assert.equal(g.lastShot,shot);assert.equal(g.intent,'Offline · repairable');
});
test('manual repair bills exactly six gold per active minute, halts on distance and full armor',()=>{
 const w=setup(),s=w.state,g=s.guards[0];g.health=60;s.coins=100;w.startRepair(g.id);advance(w,60);
 assert.equal(g.health,180);assert.equal(s.coins,94);assert.equal(s.repairGoldSpent,6);
 s.player.x+=300;w.tick(.25);assert.equal(s.repairJob,null);assert.equal(s.coins,94);
 s.player.x=g.x;s.player.y=g.y;g.health=239;w.startRepair(g.id);advance(w,1);assert.equal(g.health,240);assert.equal(s.coins,93.95);assert.equal(s.repairJob,null);
});
test('technician charges no travel/idle time and prorates the final repair with limited funds',()=>{
 const w=setup(),s=w.state,g=s.guards[0];w.buyEngineering('technician');const t=s.technicians[0];g.health=0;t.x=g.x-300;t.y=g.y;s.coins=1;
 w.toggleTechnician(t.id);w.tick(.25);assert.equal(s.coins,1);assert.equal(g.health,0);
 t.x=g.x;t.y=g.y;advance(w,10);assert.equal(s.coins,0);assert.equal(g.health,80);assert.equal(t.active,false);
 s.coins=100;g.health=240;w.toggleTechnician(t.id);advance(w,5);assert.equal(s.coins,100);
});
test('technician restores a disabled guardian in 15 working seconds for three gold',()=>{
 const w=setup(),s=w.state,g=s.guards[0];w.buyEngineering('technician');const t=s.technicians[0];g.health=0;t.x=g.x;t.y=g.y;s.coins=100;w.toggleTechnician(t.id);advance(w,15);assert.equal(g.health,240);assert.equal(s.coins,97);
});
test('repair assignment is exclusive, stops on toggle, persists and migrates old saves',()=>{
 const w=setup(),s=w.state,g=s.guards[0];w.buyEngineering('technician');w.buyEngineering('technician');g.health=100;s.coins=100;
 for(const t of s.technicians){t.x=g.x;t.y=g.y;w.toggleTechnician(t.id);}
 w.startRepair(g.id);advance(w,10);assert.equal(g.health,120);assert.equal(s.coins,99);
 w.startRepair(g.id);for(const t of s.technicians)w.toggleTechnician(t.id);advance(w,2);assert.equal(s.coins,99);
 const copy=new World();assert.ok(copy.load(w.save()));assert.equal(copy.state.guards[0].health,120);assert.ok(copy.state.tools.includes('screwdriver'));
 const old=JSON.parse(w.save());for(const k of ['guards','technicians','tools','repairJob','repairGoldSpent'])delete old[k];assert.ok(copy.load(JSON.stringify(old)));assert.deepEqual(copy.state.guards,[]);
 const bad=JSON.parse(w.save());bad.guards[0].health=-1;assert.equal(copy.load(JSON.stringify(bad)),false);
});
