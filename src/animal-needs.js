export function naturalCare(world,a,dt){
 const s=world.state;
 if(s.wolves.some(w=>!w.dead&&!w.retreat&&Math.hypot(w.x-a.x,w.y-a.y)<180))return false;
 if(a.thirst<60||a.naturalTask==='water'&&a.thirst<95){
  a.naturalTask='water';const source={x:1140,y:820};
  a.intent=Math.hypot(a.x-source.x,a.y-source.y)<70?'Drinking from the pond':'Walking to fresh water';
  world.moveTo(a,source,a.kind==='chicken'?35:45,dt);
  if(Math.hypot(a.x-source.x,a.y-source.y)<70)a.thirst=Math.min(100,a.thirst+dt*8);
  return true;
 }
 if(a.kind!=='dog'&&(a.hunger<70||a.naturalTask==='graze'&&a.hunger<95)){
  a.naturalTask='graze';a.intent=a.kind==='chicken'?'Foraging for seeds and insects':'Eating pasture grass';
  a.hunger=Math.min(100,a.hunger+dt*3);return true;
 }
 a.naturalTask=null;return false;
}
