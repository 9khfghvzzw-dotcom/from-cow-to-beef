import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {expressionFor} from '../src/expressions.js';
test('expressions follow happiness, current work and temporary social reactions',()=>{
 assert.equal(expressionFor({happiness:20},0),'sad');assert.equal(expressionFor({happiness:90},0),'happy');assert.equal(expressionFor({happiness:90,intent:'Defending home'},0),'determined');
 const n={happiness:20,expression:'happy',expressionUntil:4};assert.equal(expressionFor(n,2),'happy');assert.equal(expressionFor(n,5),'sad');
});
test('talk requires proximity, has a cooldown and preserves happiness in saves',()=>{
 const w=new World(),s=w.state,n=s.npcs[0];n.happiness=50;s.player={x:0,y:0};w.talk(n.id);assert.equal(n.happiness,50);
 s.player={x:n.x,y:n.y};w.talk(n.id);assert.equal(n.happiness,62);assert.equal(n.expression,'happy');w.talk(n.id);assert.equal(n.happiness,62);
 const copy=new World();assert.ok(copy.load(w.save()));assert.equal(copy.state.npcs[0].happiness,62);
});
test('nearby danger lowers happiness over time',()=>{
 const w=new World(),s=w.state,n=s.npcs[0];n.happiness=80;s.wolves=[{x:n.x,y:n.y,courage:10,frozen:5}];w.tick(.1);assert.ok(n.happiness<80);
});
test('social memory reduces repeated rewards and danger changes reactions',()=>{
 const w=new World(),s=w.state,n=s.npcs[0];s.player={x:n.x,y:n.y};w.talk(n.id,'joke');assert.equal(n.connection,6);s.time=21;w.talk(n.id,'joke');assert.equal(n.connection,10);
 s.time=42;s.wolves=[{x:n.x,y:n.y,frozen:0}];w.talk(n.id,'joke');assert.equal(n.connection,7);assert.equal(n.expression,'determined');assert.equal(w.persuasionOptions(n.id).find(o=>o.key==='joke').preference,-2);
 const copy=new World();assert.ok(copy.load(w.save()));assert.equal(copy.state.npcs[0].socialMemory.streak,3);
});
test('persuasion rotates strengths, allows each tactic once, clamps and cools down',()=>{
 const w=new World(),s=w.state,n=s.npcs[0];s.player={x:n.x,y:n.y};n.connection=50;
 const first=w.persuasionOptions(n.id)[0];w.persuade(n.id,first.key);assert.equal(n.connection,50+first.strength*first.preference);const after=n.connection;w.persuade(n.id,first.key);assert.equal(n.connection,after);
 assert.equal(w.persuasionOptions(n.id)[1].strength,3);for(const key of ['joke','boast','intimidate'])w.persuade(n.id,key);assert.equal(n.persuasionReady,20);const final=n.connection;w.persuade(n.id,'admire');assert.equal(n.connection,final);assert.ok(final>=0&&final<=100);
});
test('conversation choices grow individual connections and NPCs chat to each other',()=>{
 const w=new World(),s=w.state,n=s.npcs[0],other=s.npcs[1];s.player={x:n.x,y:n.y};w.talk(n.id,'joke');assert.equal(n.connection,6);assert.equal(other.connection,undefined);
 s.time=30;other.x=n.x+30;other.y=n.y;n.lastSocial=0;other.lastSocial=0;w.tick(.1);assert.ok(s.effects.some(e=>e.kind==='speech'&&e.startsAt));assert.equal(n.expression,'happy');
 const copy=new World();assert.ok(copy.load(w.save()));assert.equal(copy.state.npcs[0].connection,6);
});
