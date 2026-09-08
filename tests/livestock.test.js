import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {buyStock,sellStock,shear,tickLivestock} from '../src/livestock.js';
test('wool regrows, cannot be sheared twice, and adults sell only once',()=>{
 const w=new World(),s=w.state,a=s.animals.find(a=>a.kind==='sheep');a.hunger=a.thirst=90;
 tickLivestock(w,120);assert.equal(shear(w,a.id),true);assert.equal(shear(w,a.id),false);assert.equal(s.wool,3);
 const coins=s.coins;assert.equal(sellStock(w,a.id),true);assert.equal(sellStock(w,a.id),false);assert.equal(s.coins,coins+45);
});
test('dogs breed with two adults and puppy grows before sale; shelters restore needs',()=>{
 const w=new World(),s=w.state;s.coins=1000;buyStock(w,'dog');s.nextDogBirth=0;tickLivestock(w,.1);
 const puppy=s.animals.find(a=>a.kind==='dog'&&a.growth===0);assert.ok(puppy);assert.equal(sellStock(w,puppy.id),false);
 tickLivestock(w,180);assert.equal(sellStock(w,puppy.id),true);
 const a=s.animals.find(a=>a.kind==='sheep');a.hunger=20;a.thirst=20;s.buildings.push({id:'home',type:'sheepfold',x:a.x,y:a.y,health:100});tickLivestock(w,10);assert.ok(a.hunger>20&&a.thirst>20);
});
test('fish require habitats, breed locally, persist, sell once and piranhas damage only enemies inside',()=>{
 const w=new World(),s=w.state;s.coins=2000;assert.equal(buyStock(w,'shark'),false);assert.equal(s.coins,2000);
 for(const [kind,type] of [['goldfish','tank'],['shark','sharkTank'],['piranha','piranhaPool']]){
  const b={id:type,type,x:700,y:600,health:100,nextFishBirth:0};s.buildings.push(b);assert.ok(buyStock(w,kind));assert.ok(buyStock(w,kind));tickLivestock(w,.1);
  assert.equal(s.fish.filter(a=>a.kind===kind).length,3);
 }
 const near={id:'enemy',x:700,y:600,health:4,maxHealth:4,type:'wolf'},far={id:'far',x:1000,y:600,health:4,maxHealth:4,type:'wolf'};s.wolves=[near,far];tickLivestock(w,1);assert.ok(near.dead);assert.equal(far.health,4);const drops=s.lootDrops.length;tickLivestock(w,1);assert.equal(s.lootDrops.length,drops);
 const restored=new World();assert.ok(restored.load(w.save()));assert.equal(restored.state.fish.length,9);const a=s.fish[0],coins=s.coins;assert.ok(sellStock(w,a.id));assert.equal(sellStock(w,a.id),false);assert.equal(s.coins,coins+18);
});
