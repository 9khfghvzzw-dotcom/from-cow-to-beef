import {STOCK,buyStock,sellStock,shear} from './livestock.js';
import {LOOT,CROPS,BUILDINGS,WEAPONS,FARM_UPGRADES,SPECIAL_AMMO,SPELL_SCROLLS} from './world.js';
import {ENGINEERING} from './engineering.js';
import {itemArt} from './item-art.js';
const gold=n=>Number(n.toFixed(2));
const card=(id,title,description,buttons)=>`<article>${itemArt(id,title)}<h3>${title}</h3><p>${description}</p><div class="item-actions">${buttons}</div></article>`;
const button=(action,id,label,disabled=false)=>`<button data-${action}="${id}" ${disabled?'disabled':''}>${label}</button>`;
export function setupSettlement(world,{save,onBuild}){
  const shop=document.getElementById('shop'),content=document.getElementById('shop-content');
  const feedback=document.createElement('p');feedback.className='store-feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');content.before(feedback);
  let category='crops';
  function refresh(){
    const s=world.state,f=s.family;
    document.getElementById('shop-balance').textContent=`${gold(s.coins)} gold · ${world.population} residents · Threat level ${world.threat}`;
    const categories=[['crops','Seeds & produce'],['loot','Monster loot'],['livestock','Livestock & fish'],['buildings','Homes & land'],['weapons','Weapons'],['magic','Magic & arrows'],['engineering','Engineering'],['household','Household']];
    let html='<div class="store-tabs" aria-label="Store categories">'+categories.map(([id,label])=>`<button data-category="${id}" aria-pressed="${category===id}">${label}</button>`).join('')+'</div>';
    if(category==='loot')html+='<h3>Monster loot</h3><p>Walk over drops after defeating enemies, then sell them here.</p><div class="shop-grid">'+Object.entries(LOOT).map(([id,item])=>card(id,item.name,`${s.loot[id]||0} collected · ${item.price} gold each`,button('loot',id,`Sell all · ${(s.loot[id]||0)*item.price} gold`,!s.loot[id]))).join('')+'</div>';
    if(category==='crops')html+='<h3>Seeds & harvest</h3><div class="shop-grid">'+Object.entries(CROPS).map(([id,c])=>card(id,c.name,`${s.seeds[id]} seeds · ${s.produce[id]} harvested · Sell price: ${c.salePrice} gold each<br>Yield ${c.yield} · grows in ${Math.ceil(100/c.growRate)}s`,button('buy',id,`Seed · ${c.seedPrice} gold`)+button('sell',id,`Sell all · ${s.produce[id]*c.salePrice} gold`,!s.produce[id]))).join('')+card('feed','Animal feed',`${s.produce.clover} harvested clover available. Convert your harvest into animal feed.`,button('feed','clover','Keep clover as feed',!s.produce.clover))+'</div>';
    if(category==='livestock')html+='<h3>Eggs & dairy</h3><div class="shop-grid">'+card('eggBasket',FARM_UPGRADES.eggBasket.name,`${s.eggs} eggs stored · ${s.goldenEggs} golden eggs. Collect eggs by selecting a chicken.`,button('farm-upgrade','eggBasket',s.farmUpgrades.includes('eggBasket')?'Owned':`Buy · ${FARM_UPGRADES.eggBasket.price} gold`,s.farmUpgrades.includes('eggBasket'))+button('livestock-sell','egg','Sell eggs · 7 gold each',!s.eggs)+button('livestock-sell','goldenEgg','Sell golden eggs · 80 each',!s.goldenEggs)+button('hatch','golden','Hatch golden egg',!s.goldenEggs))+card('dairy',FARM_UPGRADES.dairy.name,`${s.milk} milk bags stored. Adult cared-for cows slowly produce milk.`,button('farm-upgrade','dairy',s.farmUpgrades.includes('dairy')?'Owned':`Buy · ${FARM_UPGRADES.dairy.price} gold`,s.farmUpgrades.includes('dairy'))+button('livestock-sell','milk','Sell milk · 12 gold each',!s.milk))+'</div>';

    if(category==='livestock'){
      html+='<h3>Animals & aquatic life</h3><p>All prices are game gold. Select an adult below to sell it. Two adult dogs have puppies; two adult fish in the same habitat reproduce. Young animals must grow before sale.</p><div class="shop-grid">'+Object.entries(STOCK).map(([id,a])=>card(id,a.name,`Buy: ${a.price} gold · Sell adult: ${a.sale} gold${a.habitat?'<br>Requires '+BUILDINGS[a.habitat].name:''}`,button('stock-buy',id,`Buy · ${a.price} gold`))).join('')+'</div>';
      html+='<h3>Your animals</h3><div class="shop-grid">'+[...s.animals,...(s.fish||[])].filter(a=>STOCK[a.kind]).map(a=>card(a.kind,STOCK[a.kind].name,`Growth: ${Math.floor(a.growth??100)}%${a.kind==='sheep'?' · Fleece: '+Math.floor(a.woolGrowth||0)+'%':''}`,button('stock-sell',a.id,`Sell · ${STOCK[a.kind].sale} gold`,(a.growth??100)<100)+(a.kind==='sheep'?button('shear',a.id,'Shear · 3 wool',(a.woolGrowth||0)<100):''))).join('')+'</div>';
      html+=card('wool','Sheep wool',`${s.wool||0} wool stored · Sell price: 9 gold each`,button('wool','all',`Sell all · ${(s.wool||0)*9} gold`,!s.wool));
    }
    if(category==='buildings')html+='<h3>A place to call home</h3><div class="shop-grid">'+Object.entries(BUILDINGS).map(([id,b])=>card(id,b.name,b.description||(id==='house'?'A small home. Adds 3 residents and a helpful neighbor who defends the settlement.':id==='barn'?'Shelter for your herd. Cows recover faster nearby.':'A defensive barrier. Enemies must break through it.'),button('build',id,`Place · ${b.price} gold`))).join('')+card('land',FARM_UPGRADES.land.name,`${s.landExpansions}/3 extra fields unlocked. Each deed immediately adds 6 plots.`,button('farm-upgrade','land',s.landExpansions>=3?'All fields owned':`Buy field · ${FARM_UPGRADES.land.price} gold`,s.landExpansions>=3))+'</div>';
    if(category==='weapons')html+='<h3>Protect the valley</h3><p>You start with a Short sword. No fixed classes: farm, cast spells and use any weapon. Press F or Attack to fight enemies.</p><div class="shop-grid">'+Object.entries(WEAPONS).map(([id,w])=>card(id,w.name,`Range ${w.range} · strength ${w.power} · ${w.cooldown}s between attacks<br>${w.description||'Reliable equipment for defending your herd.'}`,button('equip',id,s.weapon===id?'Equipped':s.weapons.includes(id)?'Equip':`Buy · ${w.price} gold`))).join('')+'</div>';
    if(category==='magic')html+='<h3>Arcane outfitter</h3><p>Learn permanent spells and equip special arrows for the Ranger bow.</p><div class="shop-grid">'+Object.entries(SPELL_SCROLLS).map(([id,x])=>card(id,x.name,`${x.description}<br>Level ${x.level} · ${x.mana} mana`,button('scroll',id,s.spellScrolls.includes(id)?'Learned':`Learn · ${x.price} gold`,s.spellScrolls.includes(id)))).join('')+Object.entries(SPECIAL_AMMO).map(([id,x])=>card(id,x.name,'A permanent arrow upgrade. Equip it whenever the Ranger bow is used.',button('ammo',id,s.specialAmmo===id?'Equipped':s.specialAmmoOwned.includes(id)?'Equip':`Buy · ${x.price} gold`))).join('')+'</div>';
    if(category==='engineering')html+='<h3>Build a safer tomorrow</h3><p>Original electric guardians for your settlement. Repairs charge only for active work; travel, idle and paused time are free.</p><div class="shop-grid">'+Object.entries(ENGINEERING).map(([id,item])=>card(id,item.name,id==='guardian'?`240 armor · electric arc · range 260<br>${s.guards.length}/4 deployed. Broken units can be repaired.`:id==='technician'?`${s.technicians.length}/2 hired. Enable maintenance after hiring.<br>240 armor/min · 12 gold/min of repairs.`:'One-time tool purchase. Select a damaged guardian and stay nearby.<br>120 armor/min · 6 gold/min of repairs.',button('engineering',id,id==='screwdriver'&&s.tools.includes(id)?'Owned':`Buy · ${item.price} gold`,id==='screwdriver'&&s.tools.includes(id)))).join('')+'</div><p>Total maintenance spent: '+gold(s.repairGoldSpent)+' gold.</p>';
    if(category==='household'){
      html+='<h3>Household stories</h3><p>Build a cottage and invite an adult companion. Both companions choose to start a family when ready.</p><div class="shop-grid">';
      if(!f.partner)html+=card('human','Lena','An adult companion to share life in the valley.',button('partner','human','Invite Lena · free'))+card('robot','Ari-7','Build a robot companion. This fictional path can lead to a human–robot family.',button('partner','robot','Build Ari-7 · 100 gold'));
      else html+=card(f.partner,f.partner==='robot'?'Ari-7':'Lena',`Your companion · bond ${f.bond}/100`,'')+card('meal','Shared meal','Enjoy time together. Meals increase bond and have a 30-second interval.',button('bond','meal','Share a meal · 2 feed'))+card('family','Family room',f.child?`Your ${f.child==='hybrid'?'human–robot':f.child==='robot'?'robot android':'human'} child is home and helps defend the settlement.`:f.arrival!==null?`A new family member arrives in ${Math.ceil(f.arrival)}s.`:'Reach level 3 and bond 100 to begin a new family chapter.',f.partner==='robot'?button('family','hybrid','Human + android child · 80 gold',f.bond<100||world.level<3||!!f.child||f.arrival!==null)+button('family','robot','Android + android child · 80 gold',f.bond<100||world.level<3||!!f.child||f.arrival!==null):button('family','human','Start a family · 80 gold',f.bond<100||world.level<3||!!f.child||f.arrival!==null));
      html+='</div>';
    }
    content.innerHTML=html;
  }
  const open=(next='crops')=>{category=next;feedback.textContent='';refresh();shop.showModal();};
  document.getElementById('shop-open').onclick=()=>open('crops');
  document.getElementById('magic-open').onclick=()=>open('magic');
  content.onclick=e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    const previous=world.state.notices[0];
    if(b.dataset.category){category=b.dataset.category;feedback.textContent='';refresh();return;}
    if(b.dataset.stockBuy)buyStock(world,b.dataset.stockBuy);
    if(b.dataset.stockSell)sellStock(world,b.dataset.stockSell);
    if(b.dataset.shear)shear(world,b.dataset.shear);
    if(b.dataset.wool){const n=world.state.wool||0;world.state.coins+=n*9;world.state.wool=0;world.notify(`Sold ${n} wool · +${n*9} gold.`);}
    if(b.dataset.loot)world.sellLoot(b.dataset.loot);
    if(b.dataset.buy)world.buySeed(b.dataset.buy);
    if(b.dataset.sell)world.sellProduce(b.dataset.sell);
    if(b.dataset.feed)world.makeFeed();
    if(b.dataset.build){const item=BUILDINGS[b.dataset.build];if(world.canAfford(item.price,item.name)){shop.close();onBuild(b.dataset.build);world.notify('Click open ground to place your building. Escape cancels.');return;}}
    if(b.dataset.equip)world.equip(b.dataset.equip);
    if(b.dataset.engineering)world.buyEngineering(b.dataset.engineering);
    if(b.dataset.farmUpgrade)world.buyFarmUpgrade(b.dataset.farmUpgrade);
    if(b.dataset.livestockSell)world.sellLivestockProduct(b.dataset.livestockSell);
    if(b.dataset.hatch)world.hatchGoldenEgg();
    if(b.dataset.ammo)world.buySpecialAmmo(b.dataset.ammo);
    if(b.dataset.scroll)world.buySpellScroll(b.dataset.scroll);
    if(b.dataset.partner)world.invitePartner(b.dataset.partner);
    if(b.dataset.bond)world.bond();
    if(b.dataset.family)world.startFamily(b.dataset.family);
    save();refresh();
    if(world.state.notices[0]!==previous)feedback.textContent=world.state.notices[0]?.text||'';
  };
  return {refresh,open};
}
