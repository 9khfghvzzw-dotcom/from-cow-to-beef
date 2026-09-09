import {currentQuest,claimQuest} from './quests.js';
import {gameClock,ENEMIES} from './encounters.js';
import {enterHome,leaveHome,startSleep,wakeUp} from './homes.js';
import {setupHomeUI} from './home-ui.js';
import {shear,sellStock,STOCK} from './livestock.js';
import { setupSettlement } from "./settlement-ui.js";
import "./style.css";
import { World, SPELLS, SPELL_SCROLLS, xpFor, CROPS, BUILDINGS, WEAPONS } from "./world.js";
import { Renderer } from "./render.js";
import { patchMarkup } from './dom.js';
import {setupInventory,useEquipment,TOOL_NAMES} from './inventory.js';
const $ = (id) => document.getElementById(id),
  world = new World(),
  canvas = $("world"),
  renderer = new Renderer(canvas),
  keys = new Set(),
  SAVE = import.meta.env.DEV && location.pathname==='/.qa/fixture.html' ? 'from-cow-to-beef:qa' : "from-cow-to-beef:v1";
let paused = false,
  target = null,
  last = performance.now(),
  saveTimer = 0,
  uiTimer = 0,
  selectionMarkup = "",
  marketId = null,
  buildMode = null, pendingHome = null;
const soundtrack = ["/audio/farm-rpg-counterpoint-v2.mp3", "/audio/strings-continuation.mp3"];
let trackIndex = 0;
const audio = new Audio(soundtrack[trackIndex]);
audio.loop = false;
audio.addEventListener('ended', () => {
  trackIndex = (trackIndex + 1) % soundtrack.length;
  audio.src = soundtrack[trackIndex];
  if (sound && !paused) audio.play().catch(() => world.notify('Tap Sound off, then Sound on to resume music.'));
});
audio.volume = 0.25;
let sound = false;
let restored = false;
try {
  const raw = localStorage.getItem(SAVE);
  if (raw) restored = world.load(raw);
} catch {}
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
function save() {
  try {
    localStorage.setItem(SAVE, world.save());
    $("save-state").textContent = "Saved on this browser";
  } catch {
    $("save-state").textContent = "Storage unavailable · keep this tab open";
  }
}
function setPause(value) {
  paused = value;
  keys.clear();
  $("paused").hidden = !value;
  $("pause").textContent = value ? "Resume" : "Pause";
  if (value) audio.pause();
  else if (sound) audio.play().catch(() => {});
  save();
}
const settlement=setupSettlement(world, {
  save,
  onBuild: (type) => {
    buildMode = type;
    canvas.style.cursor = "crosshair";
  },
});
setupInventory(world,save);
const bestiary=document.createElement('details');bestiary.innerHTML='<summary>Bestiary · 100 enemy variants</summary><p>Ten creature families with ten combat traits each. New variants unlock through level 28; levels and waves continue without an ending.</p><div class="shop-grid">'+ENEMIES.map(e=>`<article><h3>${e.name}</h3><p>Level ${e.unlock} · HP ${Number(e.health.toFixed(1))} · speed ${Math.round(e.speed)}<br>${e.description}${e.ranged?' Ranged attacker.':''}</p></article>`).join('')+'</div>';document.getElementById('guide').append(bestiary);

const homeUI=setupHomeUI(world,save);
const homeButton=document.createElement('button');homeButton.id='home-go';homeButton.textContent='My home';$('shop-open').after(homeButton);
homeButton.onclick=()=>{if(world.state.player.homeTask?.type==="bed"){world.notify("Wake up before walking home.");return;}keys.clear();const p=world.state.player,h=world.state.buildings.filter(b=>b.type==='house'&&b.health>0).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];if(!h){settlement.open('buildings');world.notify('Build a cottage or place an outdoor bed. No companion is required.');return;}world.state.selected=h.id;if(enterHome(world,h.id)){target=null;keys.clear();homeUI.refresh();}else{pendingHome=h.id;target={x:h.x,y:h.y+35};world.notify('Walking to your cottage. You can enter and sleep alone.');}};

$("pause").onclick = () => setPause(!paused);
$("resume").onclick = () => setPause(false);
$("sound").onclick = async () => {
  sound = !sound;
  if (sound) {
    try {
      await audio.play();
    } catch {
      sound = false;
      world.notify("Audio could not start. Try again.");
    }
  } else audio.pause();
  $("sound").textContent = sound ? "Sound on" : "Sound off";
  $("sound").setAttribute("aria-pressed", String(sound));
};
$("help").onclick = () => {
  $("guide").showModal();
  keys.clear();
};
document
  .querySelectorAll("[data-close]")
  .forEach((b) => (b.onclick = () => b.closest("dialog").close()));
if (!restored) $("guide").showModal();
window.addEventListener("keydown", (e) => {
  if(world.state.player.homeTask?.type==='bed'){if(e.code==='Escape'){wakeUp(world);save();homeUI.refresh();}return;}
  if(world.state.player.insideHome){if(e.code==='Escape'){leaveHome(world);keys.clear();save();homeUI.refresh();}return;}
  if (
    document.querySelector("dialog[open]") ||
    /INPUT|TEXTAREA|BUTTON/.test(e.target.tagName)
  )
    return;
  if (
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
      e.code,
    )
  )
    e.preventDefault();
  keys.add(e.code);
  target = null;
  if (e.code === "KeyF" && !paused) useEquipment(world);
  if (!e.repeat && /^Digit[1-4]$/.test(e.code))
    world.cast(Object.keys(SPELLS)[Number(e.code.at(-1)) - 1]);
  if (e.code === "Escape") {
    if (buildMode) {
      buildMode = null;
      canvas.style.cursor = "";
    } else setPause(!paused);
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.code));
window.addEventListener("blur", () => {
  keys.clear();
  save();
});
document.addEventListener("visibilitychange", () => {
  keys.clear();
  if (document.hidden) {
    audio.pause();
    save();
  } else if (sound && !paused) audio.play().catch(() => {});
  last = performance.now();
});
for (const b of document.querySelectorAll("[data-dir]")) {
  const code = {
    up: "ArrowUp",
    down: "ArrowDown",
    left: "ArrowLeft",
    right: "ArrowRight",
  }[b.dataset.dir];
  b.onpointerdown = (e) => {
    b.setPointerCapture(e.pointerId);
    keys.add(code);
    target = null;
  };
  b.onpointerup = b.onpointercancel = () => keys.delete(code);
}
canvas.onpointerdown = (e) => {
  if (paused || world.state.player.homeTask?.type==="bed") return;
  pendingHome=null;
  const r = canvas.getBoundingClientRect(),
    p = renderer.point(e.clientX - r.left, e.clientY - r.top),
    s = world.state;
  if (buildMode) {
    if (world.build(buildMode, p.x, p.y)) {
      if(buildMode!=='wall'){buildMode = null;canvas.style.cursor = '';}
      save();
    }
    return;
  }
  target = {
    x: Math.max(220, Math.min(1450, p.x)),
    y: Math.max(405, Math.min(world.southBoundary, p.y)),
  };
  const cropHit = s.crops.find((a) => Math.hypot(a.x - p.x, a.y - p.y) < 35);
  if (cropHit) {
    s.selected = `crop-${cropHit.id}`;
    selectionMarkup = "";
    return;
  }
  const nearest = [...s.cows, ...s.animals, ...s.npcs, ...s.buildings, ...s.guards, ...s.technicians]
    .map((a) => ({ a, d: Math.hypot(a.x - p.x, a.y - 20 - p.y) }))
    .sort((a, b) => a.d - b.d)[0];
  if (nearest && nearest.d < 55) {
    s.selected = nearest.a.id;
    target = { x: nearest.a.x - 65, y: nearest.a.y + 40 };
  } else {
    const crop = s.crops.find((a) => Math.hypot(a.x - p.x, a.y - p.y) < 35);
    s.selected = crop ? `crop-${crop.id}` : null;
  }
  selectionMarkup = "";
};
$("spells").innerHTML = Object.entries({...SPELLS,...SPELL_SCROLLS})
  .map(
    ([id, s], i) =>
      `<button class="spell" data-spell="${id}" title="${s.description}"><strong>${["☂", "❄", "✿", "✦", "⚡", "◇"][i]}</strong>${s.name}<small id="spell-${id}"></small></button>`,
  )
  .join("");
$("spells").onclick = (e) => {
  const b = e.target.closest("[data-spell]");
  if (b && !paused && world.state.player.homeTask?.type!=="bed" && !document.querySelector("dialog[open]"))
    world.cast(b.dataset.spell);
};
$("selection").onclick = (e) => {
  const b = e.target.closest("[data-action]");
  if (!b || paused || world.state.player.homeTask?.type==="bed") return;
  const s = world.state,
    a = b.dataset.action;
  if (a === "feed" || a === "water") world.care(s.selected, a);
  if(a==='shear')shear(world,s.selected);
  if(a==='sell-stock')sellStock(world,s.selected);
  if (a === "collect-eggs") world.collectEggs(s.selected);
  if (a === "collect-milk") world.collectMilk(s.selected);
  if(a.startsWith('persuade:'))world.persuade(s.selected,a.split(':')[1]);
  if(a.startsWith('talk:'))world.talk(s.selected,a.split(':')[1]);
  if (a === "robot") world.requestVet(s.selected);
  if (a === "harvest") world.harvest(Number(s.selected.split("-")[1]));
  if (a.startsWith("plant:"))
    world.plant(Number(s.selected.split("-")[1]), a.split(":")[1]);
  if(a.startsWith('sleep-outside:')){if(startSleep(world,Number(a.split(':')[1]),s.selected)){target=null;keys.clear();}}
  if(a==='enter-house'){if(enterHome(world,s.selected)){target=null;keys.clear();}}
  if (a === "repair") world.repair(s.selected);
  if (a === 'repair-guardian') world.startRepair(s.selected);
  if (a === 'maintenance') world.toggleTechnician(s.selected);
  if(a==='cancel-build'){buildMode=null;canvas.style.cursor='';}
  if (a === "market" || a === "market-sheep") {
    marketId = s.selected;
    $("choice").showModal();
  }
  selectionMarkup = "";
  save();
};
$("confirm-market").onclick = () => {
  const sheep=world.state.animals.some(a=>a.id===marketId&&a.kind==='sheep');
  if(sheep)world.marketSheep(marketId);else world.market(marketId);
  $("choice").close();
  selectionMarkup = "";
  save();
};
$("claim").onclick = () => { if(claimQuest(world))save(); };
function ui() {
  const s = world.state,
    level = world.level;
  $("level").textContent =
    `LEVEL ${level} · ${level < 3 ? "FIELDKEEPER" : level < 5 ? "HERD GUARDIAN" : "VALLEY STEWARD"}`;
  const progress = s.xp - xpFor(level),
    needed = xpFor(level + 1) - xpFor(level);
  $("xp").textContent = `${progress} / ${needed} XP to next level`;
  $("xp-fill").style.width = `${(progress / needed) * 100}%`;
  $("coins").textContent = `◈ ${Number(s.coins.toFixed(2))} gold`;
  $("feed").textContent = `♧ ${s.food} feed`;
  const sheepCount=s.animals.filter(a=>a.kind==='sheep').length;
  $("herd").textContent = `${s.cows.length} cows · ${sheepCount} sheep · ${world.population} residents`;
  $("mana").textContent = Math.floor(s.mana);
  $("day").textContent =
    `Day ${gameClock(s.time).day} · ${gameClock(s.time).label} ${gameClock(s.time).night?"☾ Night":"☀ Day"} · Threat ${world.threat} · ${s.wolves.filter(w=>!w.retreat).length} hostiles · wave in ${Math.ceil(s.nextWave - s.time)}s`;
  const actionLabel=s.activeTool==='weapon'?`⚔<small>${WEAPONS[s.weapon].name} · F</small>`:'⚒<small>USE TOOL · F</small>';
  if($('attack').innerHTML!==actionLabel)$('attack').innerHTML=actionLabel;
  $('attack').title=s.activeTool==='weapon'?`Equipped: ${WEAPONS[s.weapon].name}`:`Equipped: ${TOOL_NAMES[s.activeTool]}`;
  $("toast").textContent = s.notices[0]?.text || "";
  for (const [id, spec] of Object.entries({...SPELLS,...SPELL_SCROLLS})) {
    const remaining = Math.max(0, Math.ceil((s.cooldowns[id] || 0) - s.time)),
      b = document.querySelector(`[data-spell="${id}"]`);
    const unowned=!!SPELL_SCROLLS[id]&&!s.spellScrolls.includes(id);
    b.disabled = unowned || level < spec.level || remaining > 0 || s.mana < spec.mana;
    $(`spell-${id}`).textContent =
      unowned
        ? 'STORE'
        : level < spec.level
        ? `LEVEL ${spec.level}`
        : remaining
          ? `${remaining}s`
          : `${spec.mana} MANA`;
  }
  const q = currentQuest(s);
  $("quest-title").textContent = `Level ${q.level} · ${q.title}`;
  $("quest-description").textContent = q.text;
  $("quest-progress").textContent = `${q.progress} / ${q.goal} · +${q.reward} XP · +${q.gold} gold`;
  $("claim").hidden = q.progress < q.goal;
  const animal = [...s.cows, ...s.animals].find((c) => c.id === s.selected),
    npc = s.npcs.find((n) => n.id === s.selected),
    crop = s.selected?.startsWith("crop-")
      ? s.crops[Number(s.selected.split("-")[1])]
      : null;
  const meter = (label, value) =>
    `<div class="meter"><span>${label}</span><i><b style="width:${Math.round(value)}%"></b></i><em>${Math.round(value)}</em></div>`;
  let html =
    '<p class="eyebrow">WELCOME HOME</p><h2>Your own pace.</h2><p>Click an animal to meet it. Click the garden to grow something good.</p><small>WASD / arrows to walk · Click to explore</small>';
  if (animal) {
    html = `<p class="eyebrow">${animal.kind === "cow" ? (animal.growth >= 100 ? "ADULT COW" : "GROWING CALF") : animal.kind==='sheep'&&animal.growth<100?'GROWING LAMB':escape(animal.golden ? "GOLDEN CHICKEN" : animal.kind.toUpperCase())}</p><h2>${escape(animal.name || { dog: "Scout", sheep: "Woolly", chicken: "Pip" }[animal.kind])}</h2><p>${escape(animal.intent)}</p>${meter("Food", animal.hunger)}${meter("Water", animal.thirst)}${animal.kind === "cow" ? meter("Growth", animal.growth) + meter("Health", animal.health) : animal.kind==='sheep'?meter("Growth",animal.growth??100):""}<button data-action="feed">Feed · 1 clover</button><button data-action="water">Give water</button>`;
    if(animal.kind==='sheep'&&(animal.growth??100)>=100)html+=`<button data-action="market-sheep">Sell sheep · 45 gold</button><small>Healthy adult sheep reproduce naturally. There is no flock limit.</small>`;
    if(animal.kind==='sheep')html+=`<p>Fleece: ${Math.floor(animal.woolGrowth||0)}%</p><button data-action="shear" ${(animal.woolGrowth||0)<100?'disabled':''}>Shear · 3 wool (9 gold each)</button>`;
    if(['dog','chicken'].includes(animal.kind))html+=`<p>Growth: ${Math.floor(animal.growth??100)}%</p><button data-action="sell-stock" ${(animal.growth??100)<100?'disabled':''}>Sell · ${STOCK[animal.kind].sale} gold</button>`;
    if(animal.kind==='chicken')html+=`<p>${animal.eggs||0} eggs · ${animal.goldenEggs||0} golden eggs ready</p><button data-action="collect-eggs">Collect eggs</button>`;
    if(animal.kind==='cow'&&animal.growth>=100)html+=`<p>${Math.floor(animal.milk||0)} milk bags ready</p><button data-action="collect-milk">Collect milk</button>`;
    if (animal.kind === "cow")
      html +=
        animal.pregnancy !== null
          ? `<p>Expecting a calf · ${Math.ceil(100 - animal.pregnancy)}s</p>`
          : animal.vetRequested
            ? "<p>B.O.V.I. is on the way.</p>"
            : animal.rest > 0
              ? "<p>Resting after birth.</p>"
              : `<button data-action="robot" ${animal.growth < 100 ? "disabled" : ""}>Call robot · 25 coins</button><small>Artificial insemination · ${world.reserved} cows including expected calves · no herd limit</small>`;
    if (
      animal.kind === "cow" &&
      animal.growth >= 100 &&
      animal.pregnancy === null &&
      !animal.vetRequested &&
      s.cows.length > 1
    )
      html += '<button data-action="market">Optional market route</button>';
  }
  if (npc)
    html = `<p class="eyebrow">${escape(npc.role)}</p><h2>${escape(npc.name)}</h2><p>${escape(npc.intent)}</p><small>${npc.id === "vet" ? "An autonomous breeding robot. Select a healthy adult cow and request artificial insemination." : npc.id === "farmer" ? "Mara seeks out the cows who need food or water most." : npc.id === "shepherd" ? "Eli follows threats and drives wolves away from the herd." : "Your growing community shares life in the valley. Visit Household in the General Store to continue your family story."}</small>`;
  if(npc)html+=`${meter('Happiness',npc.happiness??65)}${meter('Connection',npc.connection??0)}<small>${(npc.connection??0)>=60?'Close friend':(npc.connection??0)>=25?'Friend':'Getting acquainted'}</small><p>Talk to ${escape(npc.name)}</p><button data-action="talk:greet">“How are you?”</button><button data-action="talk:joke">Tell a friendly joke</button><button data-action="talk:farm">“How is the farm doing?”</button>`;
  if(npc)html+=`<details><summary>Persuasion game</summary><p>Use each approach once. Strength rotates after every choice. Their reaction hints at what they like.</p><div class="persuasion-grid">${world.persuasionOptions(npc.id).map(o=>`<button data-action="persuade:${o.key}" ${o.used||(npc.persuasionReady??0)>s.time?'disabled':''}>${o.preference>1?'😊':o.preference>0?'🙂':o.preference===-1?'😕':'😠'} ${o.name}<br>Strength ${o.strength}/4</button>`).join('')}</div><small>${(npc.persuasionReady??0)>s.time?'Next round in '+Math.ceil(npc.persuasionReady-s.time)+'s':'Four choices per round · reactions differ for each citizen'}</small></details>`;
  if (crop)
    html = `<p class="eyebrow">${crop.type ? CROPS[crop.type].name.toUpperCase() : "EMPTY PLOT"}</p><h2>${!crop.type ? "Plant a beginning" : crop.growth >= 100 ? "Ready to gather" : "Good things take time"}</h2>${meter("Growth", crop.growth)}${meter("Water", crop.water)}${
      crop.type
        ? '<button data-action="harvest">' +
          (crop.growth >= 100 ? "Harvest produce" : "Water this plot") +
          "</button>"
        : Object.entries(CROPS)
            .map(
              ([id, c]) =>
                '<button data-action="plant:' +
                id +
                '" ' +
                (s.seeds[id] < 1 ? "disabled" : "") +
                ">Plant " +
                c.name +
                " · " +
                s.seeds[id] +
                " seeds</button>",
            )
            .join("")
    }<p>Buy seeds and sell your harvest at General Store.</p>`;
  const citizen=s.npcs.find(n=>n.id===s.selected);
  if(citizen)html+=`<p>${citizen.lifeStage||'Adult'} · Farming skill ${citizen.skills?.farming||0}/100 · Combat skill ${citizen.skills?.combat||0}/100</p>${citizen.ageSeconds!==undefined&&citizen.ageSeconds<600?'<small>Baby: first 2 minutes. Adult: after 10 minutes of active gameplay. Young children do not work or fight.</small>':''}`;
  const building = s.buildings.find((b) => b.id === s.selected);
  if (building)
    html = `<p class="eyebrow">SETTLEMENT</p><h2>${BUILDINGS[building.type].name}</h2>${meter("Health", building.health)}<button data-action="repair">Repair · 5 coins</button><p>${BUILDINGS[building.type].description || (building.type === "wall" ? "Slows attackers until its health runs out." : "Your settlement grows with every home.")}</p>`;
  if(building?.type==='house')html+='<button data-action="enter-house">Enter house</button><small>Walk near the door to enter and furnish the rooms.</small>';
  if(building?.type==='outdoorBed')html+='<p>Sleep alone · no house or companion needed.</p>'+[6,7,8,9].map(h=>`<button data-action="sleep-outside:${h}">Sleep ${h} hours</button>`).join('');
  const guardian=s.guards.find(g=>g.id===s.selected),technician=s.technicians.find(t=>t.id===s.selected);
  if(guardian)html=`<p class="eyebrow">ELECTRIC GUARDIAN</p><h2>${escape(guardian.name)}</h2><p>${escape(guardian.intent)}</p>${meter('Armor %',guardian.health/240*100)}<p>${Math.ceil(guardian.health)} / 240 armor · range 260</p><button data-action="repair-guardian">${s.repairJob===guardian.id?'Stop repairs':'Repair · 6 gold/min'}</button><small>Requires Insulated screwdriver. Stay nearby. Charges only for active work; stops at full armor or zero gold.</small>`;
  if(technician)html=`<p class="eyebrow">FIELD TECHNICIAN</p><h2>${escape(technician.name)}</h2><p>${escape(technician.intent)}</p><button data-action="maintenance">${technician.active?'Pause maintenance':'Enable maintenance · 12 gold/min'}</button><p>Repairs 960 armor/min (full repair in 15 seconds). Travel and idle time are free. Stops when funds run out.</p>`;
  if(buildMode)html=`<p class="eyebrow">BUILD MODE</p><h2>${BUILDINGS[buildMode].name}</h2><p>Click open ground. Each piece costs ${BUILDINGS[buildMode].price} gold.${buildMode==='wall'?' Keep clicking to build a wall line.':''}</p><button data-action="cancel-build">Finish building</button>`;
  if (html !== selectionMarkup) {
    // Markup is reconciled below to preserve live action buttons.
    patchMarkup($("selection"), html);
    selectionMarkup = html;
  }
}
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (!paused && !document.hidden && !document.querySelector("dialog[open]")) {
    const p = world.state.player;
    let x =
        Number(keys.has("KeyD") || keys.has("ArrowRight")) -
        Number(keys.has("KeyA") || keys.has("ArrowLeft")),
      y =
        Number(keys.has("KeyS") || keys.has("ArrowDown")) -
        Number(keys.has("KeyW") || keys.has("ArrowUp"));
    const d = Math.hypot(x, y);
    if (!p.insideHome && p.homeTask?.type!=='bed' && d) {
      p.x = Math.max(220, Math.min(1450, p.x + (x / d) * 190 * dt*(p.chilledUntil>world.state.time?.65:1)));
      p.y = Math.max(405, Math.min(world.southBoundary, p.y + (y / d) * 190 * dt*(p.chilledUntil>world.state.time?.65:1)));
    } else if (!p.insideHome && p.homeTask?.type!=='bed' && target) {
      world.moveTo(p, target, 190, dt);
      if (Math.hypot(p.x - target.x, p.y - target.y) < 4) target = null;
    }
    if(pendingHome){const h=world.state.buildings.find(b=>b.id===pendingHome);if(!h)pendingHome=null;else if(Math.hypot(h.x-p.x,h.y-p.y)<100){enterHome(world,h.id);target=null;pendingHome=null;}}
    world.tick(dt);
    saveTimer += dt;
    if (saveTimer > 5) {
      save();
      saveTimer = 0;
    }
  }
  renderer.draw(world.state);
  uiTimer += dt;
  if (uiTimer > 0.15) {
    ui();homeUI.refresh();
    uiTimer = 0;
  }
  requestAnimationFrame(frame);
}
$("attack").onclick = () => {
  if (!paused&&world.state.player.homeTask?.type!=='bed') useEquipment(world);
};
ui();
requestAnimationFrame(frame);
window.addEventListener("pagehide", save);
if (import.meta.env.DEV) window.__farm = { world, renderer, ui };
