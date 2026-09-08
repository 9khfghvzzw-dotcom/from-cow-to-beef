import test from 'node:test';
import assert from 'node:assert/strict';
import {World,levelFor,xpFor} from '../src/world.js';
import {ENEMIES,enemyFor,gameClock,tickEnemyTraits} from '../src/encounters.js';
import {naturalCare} from '../src/animal-needs.js';
test('100 unique encounter variants unlock and progression continues above level 100',()=>{
 assert.equal(ENEMIES.length,100);assert.equal(new Set(ENEMIES.map(e=>e.id)).size,100);
 assert.equal(levelFor(xpFor(150)),150);const seen=new Set();for(let wave=0;wave<100;wave++)seen.add(enemyFor(100,wave,1).archetype);assert.equal(seen.size,100);
 assert.ok(enemyFor(150,2,1).health>enemyFor(100,2,1).health);
 for(const e of ENEMIES)assert.ok(e.health>0&&e.damage>0&&e.speed>0);
});
test('clock cycles through visible night and returns to day',()=>{
 assert.equal(gameClock(0).label,'08:00');assert.equal(gameClock(300).label,'20:00');assert.ok(gameClock(300).night);assert.ok(gameClock(300).darkness>gameClock(0).darkness);assert.equal(gameClock(600).label,'08:00');assert.equal(gameClock(600).day,2);
});
test('armor, regeneration, night traits and frost change combat state',()=>{
 const w=new World(),s=w.state;const make=id=>{const a={...ENEMIES.find(e=>e.id===id)};return {...a,archetype:a.id,id:id+'actor',maxHealth:a.health,baseSpeed:a.speed,baseDamage:a.damage,x:s.player.x,y:s.player.y};};
 const armored=make('wolf-armored'),regen=make('wolf-regenerating'),night=make('wolf-nocturnal'),frost=make('wolf-frost');s.wolves=[armored,regen,night,frost];const hp=armored.health;w.damageEnemy(armored,1);assert.equal(armored.health,hp-.75);regen.health=1;s.time=300;tickEnemyTraits(w,1);assert.ok(regen.health>1);assert.ok(night.speed>night.baseSpeed);assert.ok(s.player.chilledUntil>s.time);
});
test('animals graze and drink without human intervention, but retreat during danger',()=>{
 const w=new World(),s=w.state;s.wolves=[];
 for(const kind of ['cow','sheep','chicken']){const a={kind,x:1140,y:820,hunger:30,thirst:30};for(let i=0;i<100;i++)naturalCare(w,a,1);assert.ok(a.hunger>=95);assert.ok(a.thirst>=95);}
 const a={kind:'cow',x:500,y:500,hunger:30,thirst:90};s.wolves=[{x:500,y:500}];assert.equal(naturalCare(w,a,1),false);assert.equal(a.hunger,30);
});
