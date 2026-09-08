import test from 'node:test';
import assert from 'node:assert/strict';
import {World,CROPS} from '../src/world.js';

test('chickens lay collectible eggs and a golden egg can hatch a golden layer',()=>{
  const w=new World({random:()=>0});const s=w.state,c=s.animals.find(a=>a.kind==='chicken');
  s.coins=500;w.buyFarmUpgrade('eggBasket');c.eggTimer=.01;w.tick(.1);
  assert.equal(c.goldenEggs,1);s.player={x:c.x,y:c.y};w.collectEggs(c.id);
  assert.equal(s.goldenEggs,1);w.hatchGoldenEgg();
  const gold=s.animals.find(a=>a.golden);assert.ok(gold);gold.eggTimer=.01;w.tick(.1);assert.equal(gold.goldenEggs,1);
});

test('adult cows create milk that the dairy kit collects and sells without selling cow',()=>{
  const w=new World(),s=w.state,c=s.cows[0];s.coins=500;c.growth=100;c.milk=3.8;
  w.buyFarmUpgrade('dairy');s.player={x:c.x,y:c.y};w.collectMilk(c.id);
  assert.equal(s.milk,3);const herd=s.cows.length,before=s.coins;w.sellLivestockProduct('milk');
  assert.equal(s.cows.length,herd);assert.equal(s.coins,before+36);
});

test('land deeds add plots and premium crops have profitable finite cycles',()=>{
  const w=new World(),s=w.state;s.coins=1000;const before=s.crops.length;w.buyFarmUpgrade('land');
  assert.equal(s.crops.length,before+6);assert.ok(CROPS.tea.salePrice*CROPS.tea.yield>CROPS.tea.seedPrice);assert.ok(CROPS.saffron.salePrice*CROPS.saffron.yield>CROPS.saffron.seedPrice);
});

test('special arrows and purchased spells change combat',()=>{
  const w=new World(),s=w.state;s.coins=1000;s.xp=500;s.player={x:500,y:500};s.weapons.push('bow');w.equip('bow');
  w.buySpecialAmmo('iceArrow');s.wolves=[{x:550,y:500,courage:5,frozen:0,retreat:0}];w.attack();assert.equal(s.projectiles.length,1);w.tick(.1);assert.ok(s.wolves[0].frozen>2);
  w.buySpellScroll('lightning');s.mana=100;s.wolves=[{x:550,y:500,courage:3,frozen:0,retreat:0}];w.cast('lightning');assert.ok(s.wolves[0].retreat>0);
});

test('robot partner supports android child route and android defends settlement',()=>{
  const w=new World(),s=w.state;s.coins=1000;s.xp=500;s.buildings.push({id:'home',type:'house',x:700,y:500,health:100});w.invitePartner('robot');s.family.bond=100;w.startFamily('robot');s.family.arrival=.01;w.tick(.1);
  const child=s.npcs.find(n=>n.id==='child');assert.equal(child.role,'Robot child');s.wolves=[{x:child.x+20,y:child.y,courage:2,frozen:0,retreat:0}];child.timer=0;w.tick(.1);assert.ok(s.wolves[0].retreat>0);
});

test('new economy state migrates from an earlier save',()=>{
  const old=new World(),json=JSON.parse(old.save());delete json.eggs;delete json.farmUpgrades;delete json.spellScrolls;delete json.specialAmmoOwned;
  const restored=new World();assert.equal(restored.load(JSON.stringify(json)),true);assert.equal(restored.state.eggs,0);assert.deepEqual(restored.state.farmUpgrades,[]);
});

test('high player levels raise threat and spawn stronger vampire enemies',()=>{
  const w=new World(),s=w.state;s.xp=2500;
  for(let i=0;i<3;i++)s.buildings.push({id:`h${i}`,type:'house',x:200+i*100,y:400,health:100});
  s.nextWave=0;w.tick(.1);
  const vampire=s.wolves.find(enemy=>enemy.type==='vampire');
  assert.ok(vampire);assert.ok(vampire.courage>=8);assert.ok(vampire.damage>=6);assert.ok(vampire.speed>=30);assert.ok(vampire.archetype);
});

test('farmer autonomously tends non-cow farm animals',()=>{
  const w=new World(),s=w.state,chicken=s.animals.find(a=>a.kind==='chicken'),farmer=s.npcs.find(n=>n.id==='farmer');
  chicken.hunger=20;chicken.thirst=80;farmer.x=chicken.x;farmer.y=chicken.y;farmer.timer=0;w.tick(.1);
  assert.ok(chicken.hunger>20);assert.match(farmer.intent,/Helping/);
});

test('a healthy adult flock produces a growing lamb that can later be sold',()=>{
  const w=new World({random:()=>0}),s=w.state;s.nextSheepBirth=0;w.tick(.1);
  const lamb=s.animals.find(a=>a.kind==='sheep'&&a.growth===0);assert.ok(lamb);assert.equal(s.births,1);
  lamb.growth=100;const coins=s.coins;w.marketSheep(lamb.id);
  assert.equal(s.coins,coins+45);assert.equal(s.animals.some(a=>a.id===lamb.id),false);
});
