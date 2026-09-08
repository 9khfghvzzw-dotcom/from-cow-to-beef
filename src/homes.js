export const FURNITURE={
 bed:{name:'Bed',room:'Bedroom',price:40,need:'energy',icon:'🛏️',action:'Sleeping'},
 kitchen:{name:'Kitchen',room:'Kitchen',price:55,need:'food',icon:'🍳',action:'Cooking and eating'},
 toilet:{name:'Toilet',room:'Bathroom',price:25,need:'comfort',icon:'🚽',action:'Using the bathroom'},
 shower:{name:'Shower',room:'Bathroom',price:35,need:'hygiene',icon:'🚿',action:'Showering'},
 cot:{name:'Baby cot',room:'Children’s room',price:45,need:'care',icon:'🍼',action:'Caring for the baby'},
};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function furnish(world,id,type){
 const home=world.state.buildings.find(b=>b.id===id&&b.type==='house'),item=FURNITURE[type];
 if(!home||!item||home.health<=0)return false;
 home.furniture??=[];if(home.furniture.includes(type))return false;
 if(!world.canAfford(item.price,item.name))return false;
 world.state.coins-=item.price;home.furniture.push(type);world.notify(`${item.name} placed in the ${item.room.toLowerCase()}.`);return true;
}
export function enterHome(world,id){
 const s=world.state,h=s.buildings.find(b=>b.id===id&&b.type==='house'&&b.health>0);
 if(!h)return false;
 if(dist(s.player,h)>160){world.notify('Walk closer to the cottage door to enter.');return false;}
 s.player.insideHome=id;s.player.x=h.x;s.player.y=h.y+35;return true;
}
export function leaveHome(world){const s=world.state,h=s.buildings.find(b=>b.id===s.player.insideHome);s.player.insideHome=null;s.player.homeTask=null;if(h){s.player.x=h.x+45;s.player.y=h.y+55;}}
export function useFurniture(world,type){
 const s=world.state,p=s.player,h=s.buildings.find(b=>b.id===p.insideHome);
 if(!h?.furniture?.includes(type)||p.homeTask)return false;
 if(s.npcs.some(n=>n.insideHome===h.id&&n.homeTask?.type===type)){world.notify('This furniture is being used.');return false;}
 if(type==='cot'&&!s.npcs.some(n=>n.ageSeconds!==undefined&&n.ageSeconds<120)){world.notify('There is no baby who needs care yet.');return false;}
 p.homeTask={type,remaining:8};return true;
}
export function tickHomes(world,dt){
 const s=world.state,homes=s.buildings.filter(b=>b.type==='house'&&b.health>0),reserved=new Set();
 for(const a of [s.player,...s.npcs])if(a.insideHome&&a.homeTask)reserved.add(a.insideHome+':'+a.homeTask.type);
 for(const n of [s.player,...s.npcs.filter(n=>n.id==='partner'||n.id.startsWith('resident-')||n.id==='child')]){
  n.goingHome=false;
  n.needs??={energy:85,food:85,comfort:85,hygiene:85};
  for(const key of Object.keys(n.needs))n.needs[key]=Math.max(0,n.needs[key]-dt*.12);
  if(n.insideHome&&!homes.some(h=>h.id===n.insideHome)){n.insideHome=null;n.homeTask=null;}
  if(n.homeTask&&n.insideHome){
   const t=n.homeTask,item=FURNITURE[t.type];if(!item){n.homeTask=null;continue;}
   n.intent=item.action;t.remaining-=dt;
   if(t.remaining<=0){
    if(item.need==='care'){const baby=s.npcs.find(a=>a.ageSeconds!==undefined&&a.ageSeconds<120);if(baby){baby.happiness=Math.min(100,(baby.happiness||65)+15);baby.lastCared=s.time;}}
    else n.needs[item.need]=100;
    n.happiness=Math.min(100,(n.happiness||65)+5);n.homeTask=null;
    if(n!==s.player){const h=homes.find(h=>h.id===n.insideHome);n.x=h.x+40;n.y=h.y+45;n.insideHome=null;n.intent='Returning to the farm';n.nextHomeVisit=s.time+20;}
   }continue;
  }
  if(n===s.player||n.insideHome||(n.ageSeconds!==undefined&&n.ageSeconds<600)||s.time<(n.nextHomeVisit||0))continue;
  if(s.wolves.some(w=>!w.dead&&!w.retreat&&dist(n,w)<340))continue;
  const need=Object.keys(n.needs).sort((a,b)=>n.needs[a]-n.needs[b])[0];
  const baby=s.npcs.find(a=>a.ageSeconds!==undefined&&a.ageSeconds<120&&s.time-(a.lastCared??-40)>30);
  const type=n.needs[need]<45?Object.keys(FURNITURE).find(k=>FURNITURE[k].need===need):baby?'cot':null;
  if(!type)continue;
  const h=homes.filter(h=>h.furniture?.includes(type)&&!reserved.has(h.id+':'+type)).sort((a,b)=>dist(n,a)-dist(n,b))[0];if(!h)continue;
  reserved.add(h.id+':'+type);n.goingHome=true;n.intent='Walking to the '+FURNITURE[type].room.toLowerCase();world.moveTo(n,{x:h.x,y:h.y+30},90,dt);
  if(dist(n,h)<65){n.goingHome=false;n.insideHome=h.id;n.homeTask={type,remaining:8};}
 }
}
