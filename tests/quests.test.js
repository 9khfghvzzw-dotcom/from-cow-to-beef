import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {CHAPTERS,currentQuest,claimQuest} from '../src/quests.js';
test('100 sequential chapters pay once and continue beyond 100',()=>{
 const w=new World();w.state.harvests=2;w.state.care=6;w.state.cows[0].growth=100;w.state.births=1;
 while(w.state.cows.length<5)w.addCow({growth:100,x:800,y:600});
 assert.equal(CHAPTERS.length,100);assert.equal(new Set(CHAPTERS.map(q=>q.id)).size,100);
 for(let level=1;level<=100;level++){
  let q=currentQuest(w.state);assert.equal(q.level,level);
  if(q.key){assert.equal(q.progress,0);w.state[q.key]=(w.state[q.key]||0)+q.goal;}
  const xp=w.state.xp, gold=w.state.coins;
  assert.equal(claimQuest(w),true);assert.equal(w.state.xp,xp+q.reward);assert.equal(w.state.coins,gold+q.gold);
  assert.equal(w.state.completed.filter(id=>id===q.id).length,1);
 }
 assert.equal(currentQuest(w.state).level,101);assert.equal(claimQuest(w),false);assert.equal(w.level,101);
});
test('legacy saves keep tutorials and active progress survives reload',()=>{
 const w=new World();w.state.completed=CHAPTERS.slice(0,5).map(q=>q.id);w.state.harvests=80;
 assert.equal(currentQuest(w.state).progress,0);w.state.harvests+=2;
 const loaded=new World();assert.ok(loaded.load(w.save()));assert.equal(currentQuest(loaded.state).progress,2);
 assert.equal(claimQuest(loaded),false);loaded.state.harvests++;assert.ok(claimQuest(loaded));
 assert.equal(currentQuest(loaded.state).level,7);
});
test('combat and valid spell counters count once',()=>{
 const w=new World(),s=w.state;const e={x:800,y:620,health:1};
 w.damageEnemy(e,4);w.damageEnemy(e,4);assert.equal(s.enemiesDefeated,1);
 w.cast('rain');w.cast('rain');assert.equal(s.spellsCast,1);
});
