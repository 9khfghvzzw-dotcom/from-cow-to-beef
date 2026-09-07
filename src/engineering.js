export const ENGINEERING = {
  guardian: { name: 'Voltwarden', price: 400, maxHealth: 240, range: 260, cooldown: 1.8 },
  technician: { name: 'Field technician', price: 180 },
  screwdriver: { name: 'Insulated screwdriver', price: 35 },
};
export const REPAIR = { manual: { goldPerMinute: 6, hpPerMinute: 120 }, technician: { goldPerMinute: 12, hpPerMinute: 240 } };
const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
const round = n => Math.round(n * 1e6) / 1e6;
export function buyEngineering(world, type) {
  const s=world.state, item=ENGINEERING[type];
  if (!item) return;
  if (type==='screwdriver' && s.tools.includes(type)) return world.notify('You already own the Insulated screwdriver.');
  if (type==='guardian' && s.guards.length>=4) return world.notify('Your settlement can support four Voltwardens.');
  if (type==='technician' && s.technicians.length>=2) return world.notify('Your workshop can support two technicians.');
  if (!world.canAfford(item.price,item.name)) return;
  s.coins=round(s.coins-item.price);
  if (type==='screwdriver') s.tools.push(type);
  else {
    const actor={id:`${type}-${s.nextId++}`,name:type==='guardian'?`Voltwarden ${s.guards.length+1}`:`Technician ${s.technicians.length+1}`,x:Math.max(240,Math.min(1400,s.player.x+(type==='guardian'?90:-90))),y:Math.min(940,s.player.y+40+(type==='guardian'?s.guards.length:s.technicians.length)*55),intent:'Ready for duty'};
    if(type==='guardian') s.guards.push({...actor,health:item.maxHealth,lastShot:-10});
    else s.technicians.push({...actor,active:false,target:null});
  }
  world.notify(`${item.name} ready. ${type==='technician'?'Select the technician to enable paid maintenance.':type==='screwdriver'?'Select a damaged Voltwarden to begin repairs.':'Electric defense is now online.'}`);
}
export function startRepair(world,id) {
  const s=world.state, g=s.guards.find(g=>g.id===id);
  if(s.repairJob===id) {s.repairJob=null;return world.notify('Manual repair stopped.');}
  if(!g) return;
  if(!s.tools.includes('screwdriver')) return world.notify('Buy an Insulated screwdriver in Engineering first.');
  if(g.health>=ENGINEERING.guardian.maxHealth) return world.notify(`${g.name} is already fully repaired.`);
  if(distance(s.player,g)>130) return world.notify('Walk closer to the Voltwarden to repair it.');
  if(s.coins<=0) return world.notify('Repairs need gold: 6 gold per minute of active work.');
  s.repairJob=id;
  world.notify(`Repairing ${g.name} · 6 gold/min · 120 armor/min. Move away or press Stop to cancel.`);
}
export function toggleTechnician(world,id) {
  const t=world.state.technicians.find(t=>t.id===id);if(!t)return;
  t.active=!t.active;t.target=null;
  world.notify(t.active?'Maintenance enabled · 12 gold/min only while repairing. Travel and idle time are free.':'Maintenance paused. No further repair charges.');
}
function repair(world,g,dt,mode) {
  const s=world.state, rate=REPAIR[mode];
  const seconds=Math.max(0,Math.min(dt,(ENGINEERING.guardian.maxHealth-g.health)*60/rate.hpPerMinute,s.coins*60/rate.goldPerMinute));
  if(seconds<=0)return false;
  s.coins=round(Math.max(0,s.coins-seconds*rate.goldPerMinute/60));
  g.health=round(Math.min(ENGINEERING.guardian.maxHealth,g.health+seconds*rate.hpPerMinute/60));
  s.repairGoldSpent=round(s.repairGoldSpent+seconds*rate.goldPerMinute/60);
  return true;
}
export function tickEngineering(world,dt) {
  const s=world.state, spec=ENGINEERING.guardian;
  const reserved=new Set();
  if(s.repairJob) {
    const g=s.guards.find(g=>g.id===s.repairJob);
    if(!g || distance(s.player,g)>130 || !s.tools.includes('screwdriver')) {
      s.repairJob=null;world.notify('Manual repair stopped: stay close to your Voltwarden.');
    } else {
      reserved.add(g.id);g.intent='Receiving manual repairs';repair(world,g,dt,'manual');
      if(g.health>=spec.maxHealth || s.coins<=0) {s.repairJob=null;world.notify(g.health>=spec.maxHealth?`${g.name} fully repaired.`:'Repairs stopped: no gold remaining.');}
    }
  }
  for(const t of s.technicians) {
    if(!t.active){t.intent='Maintenance paused';t.target=null;continue;}
    if(s.coins<=0){t.active=false;t.target=null;t.intent='Waiting for repair funds';world.notify('Technician paused: no gold remaining. Enable maintenance when ready.');continue;}
    const g=s.guards.filter(g=>g.health<spec.maxHealth && !reserved.has(g.id)).sort((a,b)=>a.health-b.health||distance(t,a)-distance(t,b))[0];
    if(!g){t.target=null;t.intent='On standby · no charge';continue;}
    reserved.add(g.id);t.target=g.id;t.intent=`Repairing ${g.name}`;
    g.intent='Waiting for technician';
    world.moveTo(t,g,75,dt);
    if(distance(t,g)<65){g.intent='Receiving technician repairs';repair(world,g,dt,'technician');}
  }
  for(const g of s.guards) {
    if(reserved.has(g.id))continue;
    if(g.health<=0){g.intent='Offline · repairable';continue;}
    const enemy=s.wolves.filter(w=>!w.retreat).sort((a,b)=>distance(g,a)-distance(g,b))[0];
    if(!enemy){g.intent='Patrolling the settlement';const home=s.buildings.find(b=>b.type==='house'&&b.health>0)||s.cows[0];if(home&&distance(g,home)>170)world.moveTo(g,{x:home.x+110,y:home.y+40},35,dt);continue;}
    g.intent='Intercepting a threat';
    if(distance(g,enemy)>spec.range*.75)world.moveTo(g,enemy,60,dt);
    if(distance(g,enemy)<=spec.range && s.time-g.lastShot>=spec.cooldown){
      g.lastShot=s.time;g.intent='Discharging electric arc';
      s.effects.push({kind:'electric',x:g.x,y:g.y-35,tx:enemy.x,ty:enemy.y-20,until:s.time+.35});
      enemy.courage=(enemy.courage??3)-2;enemy.frozen=Math.max(enemy.frozen||0,.6);
      if(enemy.courage<=0){enemy.retreat=15;world.award(10);s.coins=round(s.coins+4);world.notify(`${g.name} repelled a wolf · +4 gold, +10 XP.`);}
    }
  }
}
export function migrateEngineering(d) {
  d.guards??=[];d.technicians??=[];d.tools??=[];d.repairJob??=null;d.repairGoldSpent??=0;d.activeTool??='weapon';
  const toolIds=['screwdriver','hoe','watering_can','egg_basket','milking_kit'];
  if(!Array.isArray(d.guards)||d.guards.length>4||!Array.isArray(d.technicians)||d.technicians.length>2||!Array.isArray(d.tools)||d.tools.some(t=>!toolIds.includes(t))||!['weapon',...toolIds].includes(d.activeTool)||!Number.isFinite(d.repairGoldSpent)||d.repairGoldSpent<0)return false;
  for(const t of ['hoe','watering_can'])if(!d.tools.includes(t))d.tools.push(t);
  if(d.activeTool!=='weapon'&&!d.tools.includes(d.activeTool))d.activeTool='weapon';
  const ids=new Set();
  for(const g of d.guards){if(![g.x,g.y,g.health,g.lastShot].every(Number.isFinite)||g.health<0||g.health>240||typeof g.id!=='string'||typeof g.name!=='string'||ids.has(g.id))return false;ids.add(g.id);}
  for(const t of d.technicians){if(![t.x,t.y].every(Number.isFinite)||typeof t.active!=='boolean'||typeof t.id!=='string'||typeof t.name!=='string'||ids.has(t.id))return false;ids.add(t.id);}
  if(d.repairJob!==null&&!d.guards.some(g=>g.id===d.repairJob))return false;
  return true;
}
