import {CROPS,BUILDINGS,WEAPONS} from './world.js';
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
    const categories=[['crops','Seeds & produce'],['buildings','Homes & defenses'],['weapons','Weapons'],['engineering','Engineering'],['household','Household']];
    let html='<div class="store-tabs" aria-label="Store categories">'+categories.map(([id,label])=>`<button data-category="${id}" aria-pressed="${category===id}">${label}</button>`).join('')+'</div>';
    if(category==='crops')html+='<h3>Seeds & harvest</h3><div class="shop-grid">'+Object.entries(CROPS).map(([id,c])=>card(id,c.name,`${s.seeds[id]} seeds · ${s.produce[id]} harvested<br>Yield ${c.yield} · grows in ${Math.ceil(100/c.growRate)}s`,button('buy',id,`Seed · ${c.seedPrice} gold`)+button('sell',id,`Sell all · ${s.produce[id]*c.salePrice} gold`,!s.produce[id]))).join('')+card('feed','Animal feed',`${s.produce.clover} harvested clover available. Convert your harvest into animal feed.`,button('feed','clover','Keep clover as feed',!s.produce.clover))+'</div>';
    if(category==='buildings')html+='<h3>A place to call home</h3><div class="shop-grid">'+Object.entries(BUILDINGS).map(([id,b])=>card(id,b.name,id==='house'?'A small home. Adds 3 residents and a helpful neighbor.':id==='barn'?'Shelter for your herd. Cows recover faster nearby.':'A defensive barrier. Enemies must break through it.',button('build',id,`Place · ${b.price} gold`))).join('')+'</div>';
    if(category==='weapons')html+='<h3>Protect the valley</h3><p>You start with a Short sword. No fixed classes: farm, cast spells and use any weapon. Press F or Attack to repel wolves.</p><div class="shop-grid">'+Object.entries(WEAPONS).map(([id,w])=>card(id,w.name,`Range ${w.range} · strength ${w.power} · ${w.cooldown}s between attacks<br>${w.description||'Reliable equipment for defending your herd.'}`,button('equip',id,s.weapon===id?'Equipped':s.weapons.includes(id)?'Equip':`Buy · ${w.price} gold`))).join('')+'</div>';
    if(category==='engineering')html+='<h3>Build a safer tomorrow</h3><p>Original electric guardians for your settlement. Repairs charge only for active work; travel, idle and paused time are free.</p><div class="shop-grid">'+Object.entries(ENGINEERING).map(([id,item])=>card(id,item.name,id==='guardian'?`240 armor · electric arc · range 260<br>${s.guards.length}/4 deployed. Broken units can be repaired.`:id==='technician'?`${s.technicians.length}/2 hired. Enable maintenance after hiring.<br>240 armor/min · 12 gold/min of repairs.`:'One-time tool purchase. Select a damaged guardian and stay nearby.<br>120 armor/min · 6 gold/min of repairs.',button('engineering',id,id==='screwdriver'&&s.tools.includes(id)?'Owned':`Buy · ${item.price} gold`,id==='screwdriver'&&s.tools.includes(id)))).join('')+'</div><p>Total maintenance spent: '+gold(s.repairGoldSpent)+' gold.</p>';
    if(category==='household'){
      html+='<h3>Household stories</h3><p>Build a cottage and invite an adult companion. Both companions choose to start a family when ready.</p><div class="shop-grid">';
      if(!f.partner)html+=card('human','Lena','An adult companion to share life in the valley.',button('partner','human','Invite Lena · free'))+card('robot','Ari-7','Build a robot companion. This fictional path can lead to a human–robot family.',button('partner','robot','Build Ari-7 · 100 gold'));
      else html+=card(f.partner,f.partner==='robot'?'Ari-7':'Lena',`Your companion · bond ${f.bond}/100`,'')+card('meal','Shared meal','Enjoy time together. Meals increase bond and have a 30-second interval.',button('bond','meal','Share a meal · 2 feed'))+card('family','Family room',f.child?`Your ${f.child==='hybrid'?'human–robot':'human'} child is home.`:f.arrival!==null?`A new family member arrives in ${Math.ceil(f.arrival)}s.`:'Reach level 3 and bond 100 to begin a new family chapter.',button('family','room','Start a family · 80 gold',f.bond<100||world.level<3||!!f.child||f.arrival!==null));
      html+='</div>';
    }
    content.innerHTML=html;
  }
  document.getElementById('shop-open').onclick=()=>{feedback.textContent='';refresh();shop.showModal();};
  content.onclick=e=>{
    const b=e.target.closest('button');if(!b||b.disabled)return;
    const previous=world.state.notices[0];
    if(b.dataset.category){category=b.dataset.category;feedback.textContent='';refresh();return;}
    if(b.dataset.buy)world.buySeed(b.dataset.buy);
    if(b.dataset.sell)world.sellProduce(b.dataset.sell);
    if(b.dataset.feed)world.makeFeed();
    if(b.dataset.build){const item=BUILDINGS[b.dataset.build];if(world.canAfford(item.price,item.name)){shop.close();onBuild(b.dataset.build);world.notify('Click open ground to place your building. Escape cancels.');return;}}
    if(b.dataset.equip)world.equip(b.dataset.equip);
    if(b.dataset.engineering)world.buyEngineering(b.dataset.engineering);
    if(b.dataset.partner)world.invitePartner(b.dataset.partner);
    if(b.dataset.bond)world.bond();
    if(b.dataset.family)world.startFamily(b.dataset.family);
    save();refresh();
    if(world.state.notices[0]!==previous)feedback.textContent=world.state.notices[0]?.text||'';
  };
  return {refresh};
}
