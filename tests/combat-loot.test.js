import test from 'node:test';
import assert from 'node:assert/strict';
import {World,LOOT} from '../src/world.js';
const setup=()=>{const w=new World();w.state.nextWave=1e9;w.state.npcs.forEach(n=>{n.x=100;n.y=100;});return w;};
test('melee damage kills exactly once, drops loot, collects and sells persistently',()=>{
 const w=setup(),s=w.state,e={x:s.player.x+80,y:s.player.y,courage:3,frozen:0,retreat:0};s.wolves=[e];
 w.attack();assert.equal(e.health,1.5);assert.equal(s.lootDrops.length,0);
 s.time+=1;w.attack();assert.equal(e.dead,true);assert.equal(s.lootDrops.length,1);
 w.damageEnemy(e,10);assert.equal(s.lootDrops.length,1);assert.equal(s.xp,20);
 s.player.x=e.x;w.tick(.1);assert.equal(s.wolves.length,0);assert.equal(s.loot.fur,1);
 const copy=new World();assert.ok(copy.load(w.save()));const before=copy.state.coins;copy.sellLoot('fur');assert.equal(copy.state.coins,before+LOOT.fur.price);copy.sellLoot('fur');assert.equal(copy.state.coins,before+LOOT.fur.price);
});
test('bow visibly travels before impact and damages target on arrival',()=>{
 const w=setup(),s=w.state;s.weapons.push('bow');w.equip('bow');const e={x:s.player.x+300,y:s.player.y,courage:3,frozen:0,retreat:0};s.wolves=[e];
 w.attack();assert.equal(s.projectiles.length,1);assert.equal(e.health,undefined);const start=s.projectiles[0].x;
 w.tick(.1);assert.ok(s.projectiles[0].x>start);assert.equal(e.health,undefined);
 for(let i=0;i<10;i++)w.tick(.1);assert.equal(s.projectiles.length,0);assert.equal(e.health,2);
});
test('all enemy tiers drop their own saleable item',()=>{
 const w=setup();for(const [type,loot] of [['wolf','fur'],['direwolf','fang'],['vampire','essence']]){w.damageEnemy({type,x:1000,y:500},20);assert.equal(w.state.lootDrops.at(-1).type,loot);}
});
test('residents water and harvest then prioritize nearby attackers',()=>{
 const w=setup(),s=w.state,p=s.crops[0];s.cows.forEach(a=>{a.hunger=100;a.thirst=100;});s.animals.forEach(a=>{a.hunger=100;a.thirst=100;});
 const n={id:'resident-test',role:'Neighbor',name:'Test',x:p.x,y:p.y,timer:0};s.npcs.push(n);p.water=5;p.growth=100;const before=s.produce.clover;
 w.tick(.1);assert.ok(p.water<6);assert.equal(s.produce.clover,before+4);assert.equal(p.type,null);
 n.timer=0;const e={x:n.x+20,y:n.y,courage:3,frozen:0,retreat:0};s.wolves=[e];w.tick(.1);assert.equal(e.health,1.5);assert.equal(n.intent,'Defending the settlement');
});
