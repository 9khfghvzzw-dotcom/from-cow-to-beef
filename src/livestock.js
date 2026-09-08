// Prices are earned game gold. Fish live in their purchased habitat.
export const STOCK = {
  sheep: {name:'Sheep', price:60, sale:45},
  dog: {name:'Farm dog', price:80, sale:55},
  chicken: {name:'Chicken', price:30, sale:20},
  goldfish: {name:'Goldfish', price:25, sale:18, habitat:'tank'},
  shark: {name:'Shark', price:180, sale:125, habitat:'sharkTank'},
  piranha: {name:'Piranha', price:65, sale:45, habitat:'piranhaPool'},
};
export function buyStock(world,kind){
  const spec=STOCK[kind],s=world.state;if(!spec)return false;
  const home=spec.habitat?s.buildings.find(b=>b.type===spec.habitat&&b.health>0):null;
  if(spec.habitat&&!home){world.notify('Build a suitable habitat in Homes & land first.');return false;}
  if(!world.canAfford(spec.price,spec.name))return false;
  const a={id:world.id(),kind,name:spec.name,x:s.player.x+30,y:s.player.y,homeX:s.player.x+30,homeY:s.player.y,timer:0,hunger:90,thirst:90,growth:100,intent:'Settling in',eggTimer:60};
  s.coins-=spec.price;
  if(home){a.habitatId=home.id;a.x=home.x;a.y=home.y;(s.fish??=[]).push(a);}else s.animals.push(a);
  world.notify(`${spec.name} purchased · ${spec.price} gold.`);return true;
}
export function sellStock(world,id){
  const s=world.state,a=[...s.animals,...(s.fish||[])].find(a=>a.id===id),spec=STOCK[a?.kind];
  if(!spec||(a.growth??100)<100){world.notify('Only adult animals can be sold.');return false;}
  s.animals=s.animals.filter(x=>x.id!==id);s.fish=(s.fish||[]).filter(x=>x.id!==id);
  s.coins+=spec.sale;s.selected=null;s.livestockSales++;world.notify(`Sold ${spec.name} · +${spec.sale} gold.`);return true;
}
export function shear(world,id){
  const a=world.state.animals.find(a=>a.id===id&&a.kind==='sheep');
  if(!a||(a.woolGrowth||0)<100){world.notify('The fleece is still growing.');return false;}
  a.woolGrowth=0;world.state.wool=(world.state.wool||0)+3;world.notify('Sheared 3 wool. Sell it in Livestock & fish.');return true;
}
export function tickLivestock(world,dt){
  const s=world.state;s.fish??=[];s.wool??=0;
  for(const a of s.animals){
    const shelter=s.buildings.find(b=>b.health>0&&b.type===(a.kind==='sheep'?'sheepfold':a.kind==='chicken'?'coop':'kennel'));
    if(shelter){a.homeX=shelter.x;a.homeY=shelter.y+25;if(Math.hypot(a.x-shelter.x,a.y-shelter.y)<110){a.hunger=Math.min(100,a.hunger+dt*.3);a.thirst=Math.min(100,a.thirst+dt*.4);}}
    if(a.kind==='sheep'&&(a.growth??100)>=100&&a.hunger>35&&a.thirst>35)a.woolGrowth=Math.min(100,(a.woolGrowth||0)+dt*100/120);
    if(a.kind==='dog'&&(a.growth??100)<100)a.growth=Math.min(100,a.growth+dt*100/180);
  }
  s.nextDogBirth??=s.time+180;
  if(s.time>=s.nextDogBirth){
    const adults=s.animals.filter(a=>a.kind==='dog'&&(a.growth??100)>=100&&a.hunger>35&&a.thirst>35);
    if(adults.length>=2){const a=adults[0];s.animals.push({...a,id:world.id(),name:'Puppy',growth:0,timer:0});world.notify('A puppy was born! It grows into an adult in 3 minutes.');}
    s.nextDogBirth=s.time+180;
  }
  for(const b of s.buildings.filter(b=>['tank','sharkTank','piranhaPool'].includes(b.type)&&b.health>0)){
    const fish=s.fish.filter(a=>a.habitatId===b.id);
    for(const a of fish){a.growth=Math.min(100,(a.growth??100)+dt*100/150);a.x=b.x+Math.sin(s.time*.7+Number(String(a.id).replace(/\D/g,'')))*40;a.y=b.y+Math.cos(s.time*.9+fish.indexOf(a))*18;}
    b.nextFishBirth??=s.time+150;
    if(s.time>=b.nextFishBirth){const adults=fish.filter(a=>a.growth>=100);if(adults.length>=2){s.fish.push({...adults[0],id:world.id(),growth:0});world.notify('A new fish hatched!');}b.nextFishBirth=s.time+150;}
    if(b.type==='piranhaPool'&&fish.some(a=>a.growth>=100))for(const w of s.wolves)if(!w.dead&&!w.retreat&&Math.hypot((w.x-b.x)/1.5,w.y-b.y)<40)world.damageEnemy(w,dt*4);
  }
}
