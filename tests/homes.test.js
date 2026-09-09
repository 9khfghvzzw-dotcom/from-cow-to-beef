import test from 'node:test';
import assert from 'node:assert/strict';
import {World,CROPS} from '../src/world.js';
import {FURNITURE,furnish,enterHome,leaveHome,useFurniture,tickHomes} from '../src/homes.js';
import {tickTeamwork} from '../src/teamwork.js';
function setup(){const w=new World(),s=w.state;s.coins=1000;s.buildings=[{id:'home',type:'house',x:800,y:500,health:100}];s.player.x=800;s.player.y=530;return w;}
test('entry requires proximity, all furniture charges once, player uses rooms and exits safely',()=>{
 const w=setup(),s=w.state;s.player.x=200;assert.equal(enterHome(w,'home'),false);s.player.x=800;assert.ok(enterHome(w,'home'));
 for(const key of Object.keys(FURNITURE)){assert.ok(furnish(w,'home',key));assert.equal(furnish(w,'home',key),false);}
 assert.equal(s.coins,800);tickHomes(w,.1);s.player.needs.energy=20;assert.ok(useFurniture(w,'bed'));tickHomes(w,8);assert.equal(s.player.needs.energy,24);assert.ok(s.player.homeTask);tickHomes(w,192);assert.equal(s.player.needs.energy,100);assert.equal(s.player.homeTask,null);
 const restored=new World();assert.ok(restored.load(w.save()));assert.equal(restored.state.player.insideHome,'home');assert.equal(restored.state.buildings[0].furniture.length,5);leaveHome(w);assert.equal(s.player.insideHome,null);assert.equal(s.player.y,555);
});
test('residents reserve different furniture, recover needs and return to farming',()=>{
 const w=setup(),s=w.state;furnish(w,'home','bed');furnish(w,'home','shower');
 const a={id:'resident-a',x:800,y:530,needs:{energy:10,food:90,comfort:90,hygiene:90}},b={id:'resident-b',x:800,y:530,needs:{energy:90,food:90,comfort:90,hygiene:10}};s.npcs.push(a,b);
 tickHomes(w,.1);assert.equal(a.homeTask.type,'bed');assert.equal(b.homeTask.type,'shower');tickTeamwork(w,.1,CROPS);assert.equal(a.insideHome,'home');
 tickHomes(w,8);assert.equal(a.insideHome,'home');assert.equal(b.insideHome,null);assert.equal(b.needs.hygiene,100);tickHomes(w,192);assert.equal(a.insideHome,null);assert.equal(a.needs.energy,100);tickTeamwork(w,.1,CROPS);assert.ok(!a.homeTask);
});
test('nursery care is automatic and furniture cannot be double occupied',()=>{
 const w=setup(),s=w.state;furnish(w,'home','cot');s.npcs.push({id:'child',ageSeconds:0,x:820,y:530,happiness:50});
 const a={id:'resident-a',x:800,y:530},b={id:'resident-b',x:800,y:530};s.npcs.push(a,b);tickHomes(w,.1);assert.equal([a,b].filter(n=>n.homeTask).length,1);tickHomes(w,8);assert.equal(s.npcs.find(n=>n.id==='child').happiness,65);
});
