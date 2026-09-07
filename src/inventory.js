import {WEAPONS} from './world.js';
import {itemArt} from './item-art.js';
export const TOOL_NAMES={hoe:'Garden hoe',watering_can:'Watering can',screwdriver:'Insulated screwdriver',egg_basket:'Egg collecting basket',milking_kit:'Hand milking kit'};
export function equipTool(world,type){
  if(!TOOL_NAMES[type]||!world.state.tools.includes(type))return world.notify('This tool is not in your inventory.');
  world.state.activeTool=type;world.state.repairJob=null;world.notify(`${TOOL_NAMES[type]} equipped · press F or Use tool near your target.`);
}
export function useEquipment(world){
  const s=world.state;if(s.activeTool==='weapon')return world.attack();
  const dist=a=>Math.hypot(a.x-s.player.x,a.y-s.player.y);
  if(s.activeTool==='screwdriver'){const g=s.guards.find(g=>g.id===s.selected)||[...s.guards].filter(g=>g.health<240).sort((a,b)=>dist(a)-dist(b))[0];return g?world.startRepair(g.id):world.notify('Select a damaged Voltwarden to repair.');}
  if(s.activeTool==='egg_basket')return world.collectEggs(s.selected);
  if(s.activeTool==='milking_kit')return world.collectMilk(s.selected);
  const plot=s.selected?.startsWith('crop-')?s.crops.find(p=>`crop-${p.id}`===s.selected):[...s.crops].sort((a,b)=>dist(a)-dist(b))[0];
  if(s.activeTool==='hoe')return plot?world.harvest(plot.id):world.notify('Walk to a garden plot.');
  const animal=[...s.cows,...s.animals].find(a=>a.id===s.selected);if(animal)return world.care(animal.id,'water');
  if(!plot||dist(plot)>160)return world.notify('Walk closer to a garden plot or select an animal.');
  plot.water=100;world.notify('Watering can · soil refreshed.');
}
export function setupInventory(world,save){
  const dialog=document.createElement('dialog');dialog.id='inventory';document.getElementById('app').append(dialog);
  function render(){const s=world.state;
    dialog.innerHTML='<button class="close" data-close-inventory aria-label="Close inventory">×</button><p class="eyebrow">YOUR INVENTORY</p><h1>Ready for the field.</h1><p>Select owned equipment. Your Short sword, hoe and watering can are yours from the start.</p><div class="shop-grid">'+s.weapons.map(id=>{const w=WEAPONS[id];return `<article>${itemArt(id,w.name)}<h3>${w.name}</h3><p>Range ${w.range} · strength ${w.power}</p><button data-weapon="${id}">${s.activeTool==='weapon'&&s.weapon===id?'Equipped':'Equip weapon'}</button></article>`;}).join('')+s.tools.map(id=>`<article>${itemArt(id,TOOL_NAMES[id])}<h3>${TOOL_NAMES[id]}</h3><p>${id==='screwdriver'?'Repair guardians · 6 gold/min of work.':id==='egg_basket'?'Collect regular and golden eggs from chickens.':id==='milking_kit'?'Collect milk bags from adult cows.':id==='hoe'?'Harvest mature crops. Select an empty plot to choose seeds.':'Water crops and selected animals.'}</p><button data-tool="${id}">${s.activeTool===id?'Equipped':'Equip tool'}</button></article>`).join('')+'</div><p>Products: '+s.eggs+' eggs · '+s.goldenEggs+' golden eggs · '+s.milk+' milk bags</p><p>Seeds: '+Object.entries(s.seeds).map(([id,n])=>`${id} ${n}`).join(' · ')+'</p>';
  }
  document.getElementById('inventory-open').onclick=()=>{render();dialog.showModal();};
  dialog.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.hasAttribute('data-close-inventory')){dialog.close();return;}if(b.dataset.weapon)world.equip(b.dataset.weapon);if(b.dataset.tool)equipTool(world,b.dataset.tool);save();render();};
}
