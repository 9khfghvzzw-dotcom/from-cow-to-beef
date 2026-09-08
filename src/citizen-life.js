export const isAdult=n=>n.ageSeconds===undefined||n.ageSeconds>=600;
export function learn(n,skill){
 n.skills??={};n.skills[skill]=Math.min(100,(n.skills[skill]||0)+1);
}
export function tickCitizenLife(world,dt){
 const s=world.state;
 for(const n of s.npcs){
  if(n.ageSeconds===undefined)continue;
  const before=n.ageSeconds;n.ageSeconds+=dt;
  n.lifeStage=n.ageSeconds<120?'Baby':n.ageSeconds<600?'Child':'Adult';
  if(n.ageSeconds<120)n.intent='Resting safely at home';
  else if(n.ageSeconds<600)n.intent='Playing and learning at home';
  if(before<600&&n.ageSeconds>=600)world.notify(`${n.name} has grown up and can help the settlement.`);
 }
 s.citizenFamilies??=[];
 for(const family of s.citizenFamilies){
  if(family.childId||s.time<family.arrival)continue;
  const home=s.buildings.find(b=>b.id===family.homeId);if(!home||home.health<=0)continue;
  const parents=family.parents.map(id=>s.npcs.find(n=>n.id===id));if(parents.some(n=>!n))continue;
  const robots=parents.filter(n=>n.role?.includes('Robot')).length;
  const id='resident-baby-'+s.nextId++;family.childId=id;
  s.npcs.push({id,name:'Little '+s.nextId,role:robots===2?'Robot child':robots===1?'Human–robot child':'Child',ageSeconds:0,lifeStage:'Baby',x:home.x+20,y:home.y+25,timer:0,intent:'Resting safely at home',parents:family.parents});
  world.notify('A new baby has joined a neighboring household.');
 }
}
export function connectCitizens(world,a,b){
 if(!isAdult(a)||!isAdult(b))return;
 a.connections??={};b.connections??={};
 a.connections[b.id]=Math.min(100,(a.connections[b.id]||0)+8);b.connections[a.id]=Math.min(100,(b.connections[a.id]||0)+8);
 const s=world.state;s.citizenFamilies??=[];
 if(a.id==='partner'||b.id==='partner'||a.connections[b.id]<80||b.connections[a.id]<80||a.happiness<60||b.happiness<60)return;
 if(s.citizenFamilies.some(f=>f.parents.includes(a.id)||f.parents.includes(b.id)))return;
 if(a.parents?.includes(b.id)||b.parents?.includes(a.id)||a.parents?.some(id=>b.parents?.includes(id)))return;
 const homes=s.buildings.filter(h=>h.type==='house'&&h.health>0);
 const home=homes.slice(1).find(h=>!s.citizenFamilies.some(f=>f.homeId===h.id));
 if(!home)return;
 s.citizenFamilies.push({parents:[a.id,b.id],homeId:home.id,arrival:s.time+90});
 world.notify(`${a.name} and ${b.name} are preparing a family home.`);
}
