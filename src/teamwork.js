import {shear} from './livestock.js';
import {isAdult,learn} from './citizen-life.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function tickTeamwork(world,dt,crops){
 const s=world.state,claimed=new Set(),targets=new Map();
 const adults=s.npcs.filter(n=>isAdult(n)&&!n.insideHome&&!n.goingHome&&(n.id.startsWith('resident-')||n.id==='partner'||n.id==='child'||(n.id==='farmer'&&![...s.cows,...s.animals].some(a=>Math.min(a.hunger,a.thirst)<55))));
 for(const n of adults){
  n.workCooldown=Math.max(0,(n.workCooldown||0)-dt);n.combatCooldown=Math.max(0,(n.combatCooldown||0)-dt);
  const enemies=(n.id==="farmer"?[]:s.wolves).filter(e=>!e.dead&&!e.retreat&&distance(n,e)<340).sort((a,b)=>(targets.get(a)||0)-(targets.get(b)||0)||distance(n,a)-distance(n,b));
  const foe=enemies[0];
  if(foe){targets.set(foe,(targets.get(foe)||0)+1);n.intent='Defending the settlement';world.moveTo(n,foe,85,dt);
   if(distance(n,foe)<75&&!n.combatCooldown){world.damageEnemy(foe,(n.role?.includes('Robot')?2:1.5)*(1+(n.skills?.combat||0)/200));learn(n,'combat');n.combatCooldown=2;s.effects.push({kind:'npc-action',action:'attack',x:n.x,y:n.y-30,tx:foe.x,ty:foe.y-20,until:s.time+.5});}continue;}
  const jobs=[];
  for(const a of [...s.cows,...s.animals])if(Math.min(a.hunger,a.thirst)<65)jobs.push({key:'animal:'+a.id,kind:'care',target:a,priority:0});
  for(const a of s.animals)if(a.kind==='sheep'&&(a.woolGrowth||0)>=100)jobs.push({key:'animal:'+a.id,kind:'shear',target:a,priority:1});
  for(const p of s.crops){const kind=p.type&&p.growth>=100?'harvest':p.water<75?'water':!p.type&&Object.values(s.seeds).some(n=>n>0)?'plant':null;if(kind)jobs.push({key:'plot:'+p.id,kind,target:p,priority:kind==='harvest'?1:kind==='water'?2:3});}
  const available=jobs.filter(j=>!claimed.has(j.key)&&(n.id!=="farmer"||j.kind==="shear")).sort((a,b)=>a.priority-b.priority||distance(n,a.target)-distance(n,b.target));
  const saved=available.find(j=>j.key===n.assignment);
  const job=saved&&saved.priority===available[0]?.priority?saved:available[0];
  if(!job){n.assignment=null;n.intent='On standby';continue;}
  claimed.add(job.key);n.assignment=job.key;n.intent={shear:'Shearing wool',care:'Feeding and watering animals',harvest:'Harvesting crops',water:'Watering crops',plant:'Planting owned seeds'}[job.kind];world.moveTo(n,job.target,70,dt);
  if(distance(n,job.target)>55||n.workCooldown)continue;
  const t=job.target;
  if(job.kind==='care'){t.hunger=Math.min(100,t.hunger+25);t.thirst=Math.min(100,t.thirst+25);}
  if(job.kind==='shear')shear(world,t.id);
  if(job.kind==='water')t.water=100;
  if(job.kind==='harvest'){s.produce[t.type]=(s.produce[t.type]||0)+crops[t.type].yield;t.type=null;t.growth=0;s.harvests++;}
  if(job.kind==='plant'){const seed=Object.keys(crops).find(id=>s.seeds[id]>0);if(!seed)continue;s.seeds[seed]--;t.type=seed;t.growth=0;}
  s.effects.push({kind:'npc-action',action:job.kind,x:n.x,y:n.y-30,tx:t.x,ty:t.y,until:s.time+1});learn(n,'farming');n.workCooldown=3-(n.skills.farming/100);n.assignment=null;
 }
}

