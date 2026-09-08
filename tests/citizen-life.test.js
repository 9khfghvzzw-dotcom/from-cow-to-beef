import test from 'node:test';
import assert from 'node:assert/strict';
import {World,CROPS} from '../src/world.js';
import {COMPANIONS} from '../src/companions.js';
import {connectCitizens,tickCitizenLife} from '../src/citizen-life.js';
import {tickTeamwork} from '../src/teamwork.js';
function setup(){const w=new World();w.state.coins=1000;w.state.buildings=[{id:'home',type:'house',x:800,y:500,health:100},{id:'extra',type:'house',x:1000,y:500,health:100}];return w;}
test('all companion choices preserve price, identity and save; style changes preserve family',()=>{
 for(const [id,a] of Object.entries(COMPANIONS)){const w=setup();w.invitePartner(id);assert.equal(w.state.coins,1000-a.price);assert.equal(w.state.family.partner,a.kind);assert.equal(w.state.npcs.find(n=>n.id==='partner').name,a.name);w.invitePartner(id);assert.equal(w.state.coins,1000-a.price);const restored=new World();assert.ok(restored.load(w.save()));assert.equal(restored.state.family.companionDesign,id);}
 const w=setup();w.invitePartner('robot');w.state.family.bond=75;w.styleCompanion('androidFemale');assert.equal(w.state.family.bond,75);assert.equal(w.state.coins,900);assert.equal(w.state.npcs.find(n=>n.id==='partner').name,'Nova-8');
});
test('connection permits a hybrid baby; babies and children cannot fight, adults learn',()=>{
 const w=setup(),s=w.state;w.invitePartner('androidFemale');s.xp=1000;s.npcs.find(n=>n.id==='partner').connection=80;w.startFamily('hybrid');assert.equal(s.family.childDesign,'hybrid');s.family.arrival=.1;w.tick(.2);
 const baby=s.npcs.find(n=>n.id==='child');assert.equal(baby.lifeStage,'Baby');
 s.npcs=[baby];const enemy={id:'enemy',x:baby.x,y:baby.y,health:100};s.wolves=[enemy];tickTeamwork(w,.1,CROPS);assert.equal(enemy.health,100);
 tickCitizenLife(w,120);assert.equal(baby.lifeStage,'Child');tickTeamwork(w,.1,CROPS);assert.equal(enemy.health,100);
 tickCitizenLife(w,480);tickTeamwork(w,.1,CROPS);assert.ok(enemy.health<100);assert.equal(baby.skills.combat,1);
});
test('independent residents form a single hybrid family, baby grows and state persists',()=>{
 const w=setup(),s=w.state;w.recruitCitizen('androidFemale');w.recruitCitizen('humanMale');const [a,b]=s.npcs.filter(n=>n.id.startsWith('resident-'));a.happiness=b.happiness=80;
 for(let i=0;i<15;i++)connectCitizens(w,a,b);assert.equal(s.citizenFamilies.length,1);s.time=100;tickCitizenLife(w,.1);const child=s.npcs.find(n=>n.parents);assert.equal(child.role,'Human–robot child');assert.equal(child.ageSeconds,0);tickCitizenLife(w,1);assert.equal(s.npcs.filter(n=>n.parents).length,1);
 const restored=new World();assert.ok(restored.load(w.save()));assert.equal(restored.state.citizenFamilies.length,1);assert.equal(restored.state.npcs.find(n=>n.parents).ageSeconds,1);
});
