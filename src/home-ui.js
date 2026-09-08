import {FURNITURE,furnish,leaveHome,useFurniture} from './homes.js';
const safe=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function setupHomeUI(world,save){
 const el=document.createElement('section');el.id='home-interior';el.hidden=true;el.setAttribute('aria-label','Cottage interior');document.body.append(el);let old='';
 el.onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.exit){leaveHome(world);save();refresh();return;}if(b.dataset.furnish)furnish(world,world.state.player.insideHome,b.dataset.furnish);if(b.dataset.useFurniture)useFurniture(world,b.dataset.useFurniture);save();refresh();};
 function refresh(){
  const s=world.state,h=s.buildings.find(b=>b.id===s.player.insideHome&&b.health>0);el.hidden=!h;if(!h){old='';return;}
  const rooms=['Bedroom','Kitchen','Bathroom','Children’s room'];
  const html=`<header><div><small>YOUR COTTAGE</small><h1>Welcome inside</h1><p>${Math.floor(s.coins)} gold · Your farm continues outside</p></div><button data-exit="yes">Exit house</button></header><div class="home-floor">${rooms.map(room=>`<section class="home-room"><h2>${room}</h2><div class="home-furniture">${Object.entries(FURNITURE).filter(([,x])=>x.room===room).map(([id,x])=>{const owned=h.furniture?.includes(id),users=[s.player,...s.npcs].filter(n=>n.insideHome===h.id&&n.homeTask?.type===id);return `<article class="${owned?'furnished':'empty'}"><div class="furniture-picture" aria-hidden="true">${x.icon}</div><h3>${x.name}</h3>${owned?`<button data-use-furniture="${id}" ${s.player.homeTask||users.length?'disabled':''}>${x.action}</button>`:`<button data-furnish="${id}">Furnish · ${x.price} gold</button>`}<p>${users.map(n=>`<span class="home-occupant">● ${safe(n===s.player?'You':n.name)} · ${Math.ceil(n.homeTask.remaining)}s</span>`).join('')||'Available'}</p></article>`;}).join('')}</div></section>`).join('')}</div><footer>${Object.entries(s.player.needs||{}).map(([key,value])=>`<span>${key}: ${Math.round(value)}%</span>`).join(' ')}<p>Residents come home automatically for meals, rest, bathing and baby care. Each activity takes 8 seconds.</p></footer>`;
  if(html!==old){const top=el.scrollTop;el.innerHTML=html;el.scrollTop=top;old=html;}
 }
 return {refresh};
}
