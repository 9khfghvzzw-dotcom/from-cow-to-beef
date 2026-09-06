import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {equipTool,useEquipment} from '../src/inventory.js';
test('starter inventory works and only owned tools can be equipped',()=>{
 const w=new World(),s=w.state;assert.equal(s.weapon,'shortsword');assert.ok(s.weapons.includes('shortsword'));
 equipTool(w,'screwdriver');assert.equal(s.activeTool,'weapon');
 equipTool(w,'watering_can');s.player={...s.crops[0]};s.crops[0].water=3;useEquipment(w);assert.equal(s.crops[0].water,100);assert.equal(s.harvests,0);
 equipTool(w,'hoe');useEquipment(w);assert.equal(s.harvests,1);
 w.equip('shortsword');assert.equal(s.activeTool,'weapon');assert.equal(s.coins,100);
});
test('weapon variants have distinct crowd-control effects and attack cooldowns',()=>{
 const w=new World(),s=w.state;s.coins=3000;
 s.wolves=[{x:s.player.x+50,y:s.player.y,retreat:0,frozen:0},{x:s.player.x+70,y:s.player.y,retreat:0,frozen:0}];
 w.equip('hammer');w.attack();assert.ok(s.wolves.every(w=>w.retreat));assert.equal(s.xp,40);
 s.time+=2;s.wolves=[{x:s.player.x+300,y:s.player.y,retreat:0,frozen:0}];w.equip('cryo');w.attack();assert.equal(s.wolves[0].frozen,1.8);assert.equal(s.wolves[0].courage,2);w.attack();assert.equal(s.wolves[0].courage,2);
 s.time+=2;w.equip('blaster');w.attack();assert.ok(s.effects.some(e=>e.kind==='electric'));
});
test('first enemy wave arrives in 35 seconds and shepherd has a cooldown',()=>{
 const w=new World(),s=w.state;for(let i=0;i<140;i++)w.tick(.25);assert.equal(s.wolves.length,2);assert.ok(s.nextWave-s.time<60);
 const p=s.npcs[1];s.wolves=[{x:p.x,y:p.y,retreat:0,frozen:0}];w.tick(.1);assert.equal(s.wolves[0].retreat,2.9);
 s.wolves=[{x:p.x,y:p.y,retreat:0,frozen:0}];w.tick(.1);assert.equal(s.wolves[0].retreat,0);
});
