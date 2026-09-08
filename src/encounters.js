export const FAMILIES=[
 {id:'wolf',name:'Wolf',hp:3,speed:28,damage:2,shape:'beast',color:'#b18d74'},
 {id:'direwolf',name:'Dire wolf',hp:6,speed:34,damage:4,shape:'beast',color:'#718698'},
 {id:'vampire',name:'Vampire',hp:10,speed:42,damage:7,shape:'cloak',color:'#a65c9f'},
 {id:'spider',name:'Spider',hp:5,speed:44,damage:3,shape:'legs',color:'#c8984c'},
 {id:'slime',name:'Slime',hp:8,speed:20,damage:3,shape:'blob',color:'#8ada63'},
 {id:'goblin',name:'Goblin',hp:7,speed:32,damage:3,shape:'humanoid',color:'#8cb971',ranged:true},
 {id:'skeleton',name:'Skeleton',hp:9,speed:26,damage:4,shape:'bones',color:'#e0d7b5'},
 {id:'golem',name:'Golem',hp:18,speed:18,damage:6,shape:'block',color:'#9ba5a4'},
 {id:'bat',name:'Giant bat',hp:4,speed:52,damage:2,shape:'wings',color:'#9a7ea9'},
 {id:'wraith',name:'Wraith',hp:12,speed:36,damage:5,shape:'ghost',color:'#8edede',ranged:true},
];
export const TRAITS=[
 {id:'wild',name:'Wild',description:'Balanced hunter.',hp:1,speed:1,damage:1,color:'#cfb89b'},
 {id:'swift',name:'Swift',description:'Moves 45% faster.',hp:.8,speed:1.45,damage:1,color:'#fff087'},
 {id:'armored',name:'Armored',description:'Reduces incoming damage by 25%.',hp:1.3,speed:.8,damage:1,color:'#b6c6d7',armor:.25},
 {id:'berserk',name:'Berserk',description:'Deals double damage below half health.',hp:1.1,speed:1.1,damage:1.2,color:'#fb6a60'},
 {id:'regenerating',name:'Regenerating',description:'Slowly regenerates lost health.',hp:1.2,speed:.9,damage:.9,color:'#b4f092'},
 {id:'frost',name:'Frost',description:'Chills nearby defenders, slowing their movement.',hp:1,speed:1,damage:1.1,color:'#9debff'},
 {id:'ember',name:'Ember',description:'Scorches nearby crops and dries their soil.',hp:1.1,speed:1,damage:1.2,color:'#ffa658'},
 {id:'leech',name:'Leech',description:'Heals when attacking an animal.',hp:1.1,speed:1,damage:1.1,color:'#e782b0'},
 {id:'nocturnal',name:'Nocturnal',description:'Faster and stronger at night.',hp:1,speed:1,damage:1,color:'#aa95e8'},
 {id:'elder',name:'Elder',description:'Twice the health and 50% more attack power.',hp:2,speed:.85,damage:1.5,color:'#ffda89'},
];
export const ENEMIES=FAMILIES.flatMap((f,fi)=>TRAITS.map((t,ti)=>({...f,id:f.id+'-'+t.id,type:f.id,name:t.name+' '+f.name,trait:t.id,traitColor:t.color,description:t.description,unlock:1+fi*2+ti,health:f.hp*t.hp,speed:f.speed*t.speed,damage:f.damage*t.damage,armor:t.armor||0})));
export function gameClock(time){const minutes=(480+time*2.4)%1440,hour=Math.floor(minutes/60);return {day:Math.floor((480+time*2.4)/1440)+1,hour,label:String(hour).padStart(2,'0')+':'+String(Math.floor(minutes%60)).padStart(2,'0'),night:hour<6||hour>=19,darkness:hour<5||hour>=21?.52:hour<7||hour>=18?.27:0};}
export function enemyFor(level,wave,index){
 const available=ENEMIES.filter(e=>e.unlock<=level);
 // Keep familiar early progression while adding the expanded encounter roster.
 const pool=level>=5&&index===0?available.filter(e=>e.type==='vampire'):available;
 const spec=pool[(wave*7+index*11)%pool.length];
 const scaling=1+Math.max(0,level-30)*.015;
 return {...spec,archetype:spec.id,health:spec.health*scaling,maxHealth:spec.health*scaling,courage:spec.health*scaling,baseSpeed:spec.speed,baseDamage:spec.damage,damage:spec.damage*scaling};
}
export function tickEnemyTraits(world,dt){
 const s=world.state,night=gameClock(s.time).night;
 for(const e of s.wolves){if(e.dead||e.retreat||!e.archetype)continue;
  const scale=1+Math.max(0,world.level-30)*.015;
  e.speed=e.baseSpeed*(e.trait==='nocturnal'&&night?1.3:1);
  e.damage=e.baseDamage*scale*(e.trait==='berserk'&&e.health<e.maxHealth/2?2:e.trait==='nocturnal'&&night?1.5:1);
  if(e.trait==='regenerating')e.health=Math.min(e.maxHealth,e.health+dt*.3);
  if(e.trait==='ember')for(const p of s.crops)if(Math.hypot(p.x-e.x,p.y-e.y)<90)p.water=Math.max(0,p.water-dt*3);
  if(e.trait==='frost')for(const n of [s.player,...s.npcs,...s.guards])if(Math.hypot(n.x-e.x,n.y-e.y)<80)n.chilledUntil=s.time+.5;
 }
}
export function drawEnemy(r,e,time){
 const c=r.ctx;c.save();c.translate(e.x,e.y);const color=e.color||'#af8772';
 r.ellipse(0,4,23,8,'#15372b55');
 if(e.shape==='beast'){r.ellipse(0,-15,25,14,color);r.ellipse(23,-23,14,12,color);r.path([[16,-32],[19,-46],[27,-33]],color);c.fillStyle=color;c.fillRect(-17,-10,6,16);c.fillRect(12,-10,6,16);}
 else if(e.shape==='legs'){for(let i=0;i<4;i++){const y=-20+i*7;c.strokeStyle=color;c.lineWidth=3;c.beginPath();c.moveTo(-8,y);c.lineTo(-30,y-8);c.lineTo(-38,y+9);c.moveTo(8,y);c.lineTo(30,y-8);c.lineTo(38,y+9);c.stroke();}r.ellipse(0,-15,17,22,color);}
 else if(e.shape==='wings'){const flap=Math.sin(time*9)*8;r.path([[0,-22],[-42,-44-flap],[-31,-9],[-12,-7],[0,0],[12,-7],[31,-9],[42,-44-flap]],color);r.ellipse(0,-19,10,18,color);}
 else if(e.shape==='blob'){r.ellipse(0,-10,28,20+Math.sin(time*3)*2,color);}
 else if(e.shape==='block'){c.fillStyle=color;c.fillRect(-22,-40,44,40);c.fillRect(-14,-56,28,20);c.fillRect(-32,-35,9,29);c.fillRect(24,-35,9,29);}
 else if(e.shape==='bones'){c.strokeStyle=color;c.lineWidth=5;c.beginPath();c.moveTo(0,-38);c.lineTo(0,-10);c.moveTo(-20,-28);c.lineTo(20,-28);c.moveTo(0,-10);c.lineTo(-13,7);c.moveTo(0,-10);c.lineTo(13,7);c.stroke();r.ellipse(0,-46,12,12,color);}
 else {r.path([[-18,0],[-12,-35],[0,-48],[12,-35],[18,0],[8,-5],[0,0],[-8,-5]],color);r.ellipse(0,-43,11,12,color);if(e.shape==='humanoid'){r.path([[-10,-44],[-25,-49],[-12,-33]],color);r.path([[10,-44],[25,-49],[12,-33]],color);}}
 r.ellipse(-4,-28,2,3,'#fff6ba');r.ellipse(4,-28,2,3,'#fff6ba');
 c.strokeStyle=e.traitColor||'#eddbaa';c.lineWidth=3;c.beginPath();c.ellipse(0,-15,33,35,0,0,Math.PI*2);c.stroke();c.restore();
}
