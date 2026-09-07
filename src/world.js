import {tickTeamwork} from './teamwork.js';
import { buyEngineering, startRepair, toggleTechnician, tickEngineering, migrateEngineering } from './engineering.js';
// Generous corruption guards, far beyond normal play; these are not gameplay limits.
const ANIMAL_SAFETY_GUARD = 5000;
const BUILDING_SAFETY_GUARD = 3000;
export const LOOT = {fur:{name:'Wolf fur',price:12},fang:{name:'Dire wolf fang',price:24},essence:{name:'Vampire essence',price:40}};
export const BUILDINGS = {
  house: { name: "Cottage", price: 75, size: 65, population: 3 },
  barn: { name: "Barn", price: 110, size: 75, population: 1 },
  wall: { name: "Stone wall", price: 12, size: 28, population: 0 },
};
export const FARM_UPGRADES = {
  land: { name: "Garden land deed", price: 120 },
  dairy: { name: "Hand milking kit", price: 90 },
  eggBasket: { name: "Egg collecting basket", price: 45 },
};
export const SPECIAL_AMMO = {
  fireArrow: { name: "Fire arrows", price: 75, power: 1, burn: 4 },
  iceArrow: { name: "Ice arrows", price: 85, power: .5, stun: 3 },
  stormArrow: { name: "Storm arrows", price: 110, power: 1.5, chain: 110 },
};
export const SPELL_SCROLLS = {
  lightning: { name: "Lightning storm", price: 140, level: 3, mana: 34, cooldown: 14, description: "Electric arcs repel up to four nearby attackers." },
  sanctuary: { name: "Sanctuary shield", price: 160, level: 3, mana: 30, cooldown: 22, description: "Protect animals, people and buildings for 12 seconds." },
};
export const WEAPONS = {
  shortsword: {name:'Short sword',price:0,range:110,power:1.5,cooldown:.65,description:'Your starting blade. Two quick hits defeat a wolf.'},
  spear: { name: 'Steel spear', price: 140, range: 210, power: 2, cooldown: .85, description: 'Long melee reach; keeps attackers at a distance.' },
  hammer: { name: 'Shockwave hammer', price: 210, range: 135, power: 3, cooldown: 1.6, splash: 100, description: 'Slow heavy strike that hits up to three nearby wolves.' },
  blaster: { name: 'Arc blaster', price: 300, range: 420, power: 1.5, cooldown: .8, stun: .45, description: 'Fast electric shots briefly stun a distant target.' },
  cryo: { name: 'Frost launcher', price: 260, range: 360, power: 1, cooldown: 1.4, stun: 1.8, description: 'Lower damage; freezes an attacker for 1.8 seconds.' },
  staff: { name: "Field staff", price: 0, range: 115, power: 1, cooldown: 0.7 },
  bow: { name: "Ranger bow", price: 65, range: 380, power: 1, cooldown: 1 },
  sword: {
    name: "Iron sword",
    price: 85,
    range: 130,
    power: 2,
    cooldown: 0.55,
  },
};
export const CROPS = {
  clover: {
    name: "Clover",
    seedPrice: 3,
    salePrice: 2,
    yield: 4,
    growRate: 1.6,
    color: "#b7c968",
  },
  carrot: {
    name: "Carrot",
    seedPrice: 5,
    salePrice: 5,
    yield: 3,
    growRate: 1.1,
    color: "#e7a160",
  },
  wheat: {
    name: "Wheat",
    seedPrice: 7,
    salePrice: 4,
    yield: 5,
    growRate: 0.8,
    color: "#e1c779",
  },
  tea: { name: "Tea leaves", seedPrice: 16, salePrice: 13, yield: 4, growRate: .48, color: "#4f9c67" },
  saffron: { name: "Saffron", seedPrice: 30, salePrice: 32, yield: 3, growRate: .28, color: "#d66a9f" },
};
export const SPELLS = {
  rain: {
    name: "Raincall",
    level: 1,
    mana: 18,
    cooldown: 12,
    description: "Refresh nearby animals and water every crop.",
  },
  frost: {
    name: "Frost ring",
    level: 2,
    mana: 22,
    cooldown: 9,
    description: "Freeze nearby wolves so the herd can escape.",
  },
  bloom: {
    name: "Wild bloom",
    level: 3,
    mana: 30,
    cooldown: 20,
    description: "Grow crops and nurture nearby calves.",
  },
  fire: {
    name: "Ember ward",
    level: 4,
    mana: 28,
    cooldown: 10,
    description: "Scare nearby wolves away from the pasture.",
  },
};
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const levelFor = (xp) =>
  Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
export const xpFor = (level) => (level - 1) ** 2 * 100;

export class World {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.state = {
      version: 1,
      time: 0,
      xp: 0,
      coins: 100,
      mana: 100,
      food: 12,
      harvests: 0,
      births: 0,
      care: 0,
      deliveries: 0,
      nextId: 1,
      nextSheepBirth: 150,
      weapon: "shortsword",
      weapons: ["staff", "shortsword"],
      lastAttack: -10,
      seeds: { clover: 2, carrot: 1, wheat: 1 },
      produce: { clover: 0, carrot: 0, wheat: 0 },
      eggs: 0, goldenEggs: 0, milk: 0, livestockSales: 0,
      farmUpgrades: [], landExpansions: 0, specialAmmo: null, specialAmmoOwned: [], spellScrolls: [], sanctuaryUntil: 0,
      sales: 0,
      buildings: [],
      guards: [], technicians: [], tools: ['hoe','watering_can'], activeTool: 'weapon', repairJob: null, repairGoldSpent: 0,
      family: {
        partner: null,
        bond: 0,
        lastGift: -60,
        child: null,
        arrival: null,
      },
      wave: 0,
      nextWave: 35,
      player: { x: 760, y: 620 },
      selected: null,
      cooldowns: {},
      effects: [],
      notices: [],
      completed: [],
      cows: [],
      animals: [],
      wolves: [],
      projectiles: [], lootDrops: [], loot: {},
      crops: [],
      npcs: [
        {
          id: "farmer",
          name: "Mara",
          role: "Farmer",
          x: 540,
          y: 420,
          intent: "Checking the herd",
          timer: 0,
        },
        {
          id: "shepherd",
          name: "Eli",
          role: "Shepherd",
          x: 1100,
          y: 600,
          intent: "Watching the pasture",
          timer: 0,
        },
        {
          id: "vet",
          name: "B.O.V.I.",
          role: "Breeding robot",
          x: 300,
          y: 360,
          intent: "Ready for a farm visit",
          target: null,
          timer: 0,
        },
      ],
    };
    this.addCow({ name: "Clover", growth: 75, x: 890, y: 540 });
    this.addCow({ name: "Maple", growth: 35, x: 1000, y: 650 });
    for (const [kind, x, y] of [
      ["sheep", 1150, 540],
      ["sheep", 1220, 580],
      ["chicken", 450, 650],
      ["chicken", 490, 620],
      ["dog", 730, 700],
    ])
      this.state.animals.push({
        id: this.id(),
        kind,
        x,
        y,
        homeX: x,
        homeY: y,
        timer: 0,
        hunger: 80,
        thirst: 85,
        growth: kind === "sheep" ? 100 : undefined,
        intent: "Exploring",
        eggTimer: kind === "chicken" ? 45 + this.random() * 45 : undefined,
        eggs: 0,
        golden: false,
      });
    for (let i = 0; i < 6; i++)
      this.state.crops.push({
        id: i,
        x: 390 + (i % 3) * 65,
        y: 460 + Math.floor(i / 3) * 65,
        type: i < 4 ? "clover" : null,
        growth: i < 2 ? 100 : i < 4 ? 20 : 0,
        water: 70,
      });
  }
  id() {
    return `animal-${this.state.nextId++}`;
  }
  buyEngineering(type) { return buyEngineering(this,type); }
  startRepair(id) { return startRepair(this,id); }
  toggleTechnician(id) { return toggleTechnician(this,id); }
  get level() {
    return levelFor(this.state.xp);
  }
  get population() {
    return (
      3 +
      this.state.buildings.reduce((n, b) => n + BUILDINGS[b.type].population, 0)
    );
  }
  get threat() {
    return (
      1 +
      Math.floor((this.population - 3) / 3) +
      Math.floor(this.state.cows.length / 5) +
      Math.floor((this.level - 1) / 2)
    );
  }
  get reserved() {
    return (
      this.state.cows.length +
      this.state.cows.filter((c) => c.pregnancy !== null || c.vetRequested)
        .length
    );
  }
  addCow({ name, growth = 0, x = 850, y = 600 } = {}) {
    if (this.state.cows.length + this.state.animals.length >= ANIMAL_SAFETY_GUARD) return null;
    const cow = {
      id: this.id(),
      kind: "cow",
      name: name || `Calf ${this.state.nextId - 1}`,
      x,
      y,
      growth,
      health: 100,
      hunger: 80,
      thirst: 80,
      pregnancy: null,
      vetRequested: false,
      rest: 0,
      timer: 0,
      intent: "Grazing",
    };
    this.state.cows.push(cow);
    return cow;
  }
  addSheep({ name, growth = 0, x = 1150, y = 560 } = {}) {
    if (this.state.cows.length + this.state.animals.length >= ANIMAL_SAFETY_GUARD) return null;
    const sheep = {
      id: this.id(), kind: "sheep", name: name || `Lamb ${this.state.nextId - 1}`,
      x, y, homeX: x, homeY: y, timer: 0, hunger: 85, thirst: 85,
      growth, intent: growth >= 100 ? "Grazing with the flock" : "Growing beside the flock",
    };
    this.state.animals.push(sheep);
    return sheep;
  }
  notify(text) {
    if(/harvest|Collected|born|Sold|complete/i.test(text)){this.state.player.expression='happy';this.state.player.expressionUntil=this.state.time+2;}
    this.state.notices.unshift({ text, until: this.state.time + 6 });
    this.state.notices.length = Math.min(4, this.state.notices.length);
    return text;
  }
  award(amount) {
    this.state.xp += amount;
  }
  care(id, action) {
    const cow = [...this.state.cows, ...this.state.animals].find(
      (c) => c.id === id,
    );
    if (!cow) return this.notify("Choose an animal first.");
    if (distance(this.state.player, cow) > 180)
      return this.notify("Walk closer to your animal.");
    const key = action === "feed" ? "hunger" : "thirst";
    if (cow[key] > 90)
      return this.notify(
        `${cow.name || cow.kind} does not need ${action === "feed" ? "food" : "water"} yet.`,
      );
    if (action === "feed" && this.state.food < 1)
      return this.notify("Harvest clover to refill your feed bag.");
    if (action === "feed") this.state.food--;
    cow[key] = Math.min(100, cow[key] + 35);
    cow.health = Math.min(100, (cow.health ?? 100) + 8);
    this.state.care++;
    this.award(12);
    return this.notify("+12 XP · A little care goes a long way.");
  }
  harvest(id) {
    const crop = this.state.crops.find((c) => c.id === id);
    if (!crop || distance(this.state.player, crop) > 160)
      return this.notify("Walk over to the garden.");
    if (!crop.type) return this.notify("Plant seeds in this empty plot first.");
    if (crop.growth < 100) {
      crop.water = 100;
      return this.notify("Plot watered. Come back when the crop is golden.");
    }
    const spec = CROPS[crop.type];
    this.state.produce[crop.type] += spec.yield;
    crop.growth = 0;
    crop.water = 60;
    crop.type = null;
    this.state.harvests++;
    this.award(18);
    return this.notify(
      `+18 XP · ${spec.yield} ${spec.name} harvested. Sell it at the shop or keep clover for feed.`,
    );
  }
  canAfford(price, itemName) {
    const missing = Math.max(0, price - this.state.coins);
    if (!missing) return true;
    this.notify(`Insufficient funds — you need ${Number(missing.toFixed(2))} more gold to buy ${itemName}.`);
    return false;
  }
  buySeed(type) {
    const spec = CROPS[type];
    if (!spec) return;
    if (!this.canAfford(spec.seedPrice, `${spec.name} seeds`)) return;
    this.state.coins -= spec.seedPrice;
    this.state.seeds[type]++;
    return this.notify(`${spec.name} seeds added to your bag.`);
  }
  buyFarmUpgrade(type) {
    const spec=FARM_UPGRADES[type],s=this.state;if(!spec)return;
    if(type!=='land'&&s.farmUpgrades.includes(type))return this.notify(`${spec.name} is already owned.`);
    if(type==='land'&&s.landExpansions>=3)return this.notify('All three garden fields are already unlocked.');
    if(!this.canAfford(spec.price,spec.name))return;s.coins-=spec.price;
    if(type==='land'){
      const row=s.landExpansions++, base=6+row*6;
      for(let i=0;i<6;i++)s.crops.push({id:base+i,x:590+(i%3)*65,y:700+row*95+Math.floor(i/3)*65,type:null,growth:0,water:70});
      this.notify('New garden field unlocked · 6 planting plots ready.');
    } else {s.farmUpgrades.push(type);s.tools.push(type==='dairy'?'milking_kit':'egg_basket');this.notify(`${spec.name} added to your inventory.`);}
  }
  buySpecialAmmo(type){const a=SPECIAL_AMMO[type],s=this.state;if(!a)return;if(!s.specialAmmoOwned.includes(type)){if(!this.canAfford(a.price,a.name))return;s.coins-=a.price;s.specialAmmoOwned.push(type);}s.specialAmmo=type;return this.notify(`${a.name} equipped for the bow.`);}
  buySpellScroll(type){const a=SPELL_SCROLLS[type],s=this.state;if(!a||s.spellScrolls.includes(type))return this.notify('This spell is already learned.');if(!this.canAfford(a.price,a.name))return;s.coins-=a.price;s.spellScrolls.push(type);return this.notify(`${a.name} learned.`);}
  collectEggs(id){const s=this.state,c=s.animals.find(a=>a.id===id&&a.kind==='chicken');if(!c)return;if(!s.farmUpgrades.includes('eggBasket'))return this.notify('Buy an Egg collecting basket first.');if(!c.eggs&&!c.goldenEggs)return this.notify('No eggs ready yet.');s.eggs+=c.eggs||0;s.goldenEggs+=c.goldenEggs||0;const n=(c.eggs||0)+(c.goldenEggs||0);c.eggs=0;c.goldenEggs=0;this.award(n*4);return this.notify(`Collected ${n} egg${n===1?'':'s'}${s.goldenEggs?' · golden treasure secured!':''}.`);}
  collectMilk(id){const s=this.state,c=s.cows.find(a=>a.id===id);if(!c||c.growth<100)return this.notify('Only an adult cow can be milked.');if(!s.farmUpgrades.includes('dairy'))return this.notify('Buy the Hand milking kit first.');if((c.milk||0)<1)return this.notify('No milk ready yet.');const n=Math.floor(c.milk);c.milk-=n;s.milk+=n;this.award(n*3);return this.notify(`Collected ${n} milk bag${n===1?'':'s'}.`);}
  sellLivestockProduct(type){const s=this.state,field=type==='goldenEgg'?'goldenEggs':type==='egg'?'eggs':'milk',price=type==='goldenEgg'?80:type==='egg'?7:12,n=s[field]||0;if(!n)return this.notify('Collect this product before selling.');s.coins+=n*price;s[field]=0;s.livestockSales+=n;this.award(n*3);return this.notify(`Sold ${n} ${type==='goldenEgg'?'golden eggs':type==='egg'?'eggs':'milk bags'} · +${n*price} gold.`);}
  hatchGoldenEgg(){const s=this.state;if(!s.goldenEggs)return this.notify('You need a golden egg to hatch.');s.goldenEggs--;const a={id:this.id(),kind:'chicken',name:'Aurelia',x:510,y:650,homeX:510,homeY:650,timer:0,hunger:90,thirst:90,intent:'A golden chick',eggTimer:30,eggs:0,goldenEggs:0,golden:true};s.animals.push(a);this.award(100);return this.notify('A golden chick hatched! Every egg she lays will be golden.');}
  plant(id, type) {
    const p = this.state.crops.find((p) => p.id === id);
    if (!p || p.type || !CROPS[type])
      return this.notify("Choose an empty garden plot.");
    if (distance(this.state.player, p) > 160)
      return this.notify("Walk closer to this plot.");
    if (this.state.seeds[type] < 1)
      return this.notify("Buy these seeds at the farm shop first.");
    this.state.seeds[type]--;
    p.type = type;
    p.growth = 0;
    p.water = 70;
    return this.notify(`${CROPS[type].name} planted. Keep the soil watered.`);
  }
  sellProduce(type) {
    const spec = CROPS[type],
      count = this.state.produce[type];
    if (!spec || !count)
      return this.notify("Harvest some produce before selling.");
    this.state.coins += count * spec.salePrice;
    this.state.produce[type] = 0;
    this.state.sales += count;
    this.award(count * 2);
    return this.notify(
      `Sold ${count} ${spec.name} · +${count * spec.salePrice} coins, +${count * 2} XP.`,
    );
  }
  makeFeed() {
    const n = this.state.produce.clover;
    if (!n) return this.notify("Harvest clover first.");
    this.state.food += n;
    this.state.produce.clover = 0;
    return this.notify(`${n} clover moved into your feed bag.`);
  }
  equip(type) {
    const spec = WEAPONS[type],
      s = this.state;
    if (!spec) return;
    if (!s.weapons.includes(type)) {
      if (!this.canAfford(spec.price, spec.name)) return;
      s.coins -= spec.price;
      s.weapons.push(type);
    }
    s.weapon = type;
    s.activeTool='weapon';s.repairJob=null;
    return this.notify(`${spec.name} equipped.`);
  }
  attack() {
    const s = this.state,
      spec = WEAPONS[s.weapon];
    if (s.time - s.lastAttack < spec.cooldown) return;
    s.lastAttack = s.time;
    s.player.expression='determined';s.player.expressionUntil=s.time+1;
    s.effects.push({
      kind: "attack",
      x: s.player.x,
      y: s.player.y,
      until: s.time + 0.6,
    });
    const enemy = s.wolves
      .filter((w) => !w.retreat && distance(w, s.player) < spec.range)
      .sort((a, b) => distance(a, s.player) - distance(b, s.player))[0];
    if (!enemy) return this.notify("No enemy within weapon range.");
    const ammo=s.weapon==='bow'&&s.specialAmmo?SPECIAL_AMMO[s.specialAmmo]:null;
    if(s.weapon==='bow'){
      enemy.id??=this.id();
      s.projectiles.push({x:s.player.x+22,y:s.player.y-30,target:enemy.id,power:spec.power+(ammo?.power||0)+(ammo?.burn||0),stun:ammo?.stun||0,chain:ammo?.chain||0,color:s.specialAmmo==='fireArrow'?'#ff954b':s.specialAmmo==='iceArrow'?'#8eeaff':'#ffe1a0'});
      return this.notify('Arrow fired!');
    }
    const targets=[enemy,...(spec.splash?s.wolves.filter(w=>w!==enemy&&!w.retreat&&distance(w,enemy)<=spec.splash&&distance(w,s.player)<=spec.range).slice(0,2):[])];
    for(const victim of targets){
      this.damageEnemy(victim,spec.power);
      if(spec.stun)victim.frozen=Math.max(victim.frozen||0,spec.stun);
      if(s.weapon==='blaster')s.effects.push({kind:'electric',x:s.player.x,y:s.player.y-35,tx:victim.x,ty:victim.y-20,until:s.time+.3});
      if(s.weapon==='cryo')s.effects.push({kind:'frost',x:victim.x,y:victim.y,until:s.time+1});
    }
  }
  damageEnemy(enemy,amount){
    if(enemy.dead||amount<=0)return;
    const s=this.state;
    enemy.maxHealth??=enemy.type==='vampire'?10:enemy.type==='direwolf'?6:3;
    enemy.health=Math.max(0,(enemy.health??enemy.courage??enemy.maxHealth)-amount);
    enemy.courage=enemy.health;
    s.effects.push({kind:'damage',amount,x:enemy.x,y:enemy.y-85,until:s.time+.8});
    if(enemy.health===0){
      enemy.dead=true;enemy.retreat=15;
      const type=enemy.type==='vampire'?'essence':enemy.type==='direwolf'?'fang':'fur';
      s.lootDrops.push({id:this.id(),type,x:enemy.x,y:enemy.y});
      this.award(20);s.coins+=6;
      this.notify(`Enemy defeated · +20 XP, +6 gold. Walk over the loot to collect ${LOOT[type].name}.`);
    }
  }
  sellLoot(type){
    const s=this.state,n=s.loot[type]||0;
    if(!LOOT[type]||!n)return;
    s.coins+=n*LOOT[type].price;s.loot[type]=0;
    this.notify(`Sold ${n} ${LOOT[type].name} · +${n*LOOT[type].price} gold.`);
  }

  build(type, x, y) {
    const spec = BUILDINGS[type],
      s = this.state;
    if (!spec) return false;
    x = Math.round(x / 40) * 40;
    y = Math.round(y / 40) * 40;
    if (!this.canAfford(spec.price, spec.name)) return false;
    if (s.buildings.length >= BUILDING_SAFETY_GUARD) return false;
    if (
      x < 240 ||
      x > 1450 ||
      y < 430 ||
      y > 1000 ||
      (x > 970 && x < 1340 && y > 760) ||
      s.crops.some((p) => Math.hypot(p.x - x, p.y - y) < 90) ||
      s.buildings.some(
        (b) =>
          Math.hypot(b.x - x, b.y - y) <
          (BUILDINGS[b.type].size + spec.size) * 0.65,
      ) ||
      [...s.cows, ...s.npcs, s.player].some(
        (a) => Math.hypot(a.x - x, a.y - y) < spec.size,
      )
    ) {
      this.notify(
        "Choose open ground away from animals, crops, water and other buildings.",
      );
      return false;
    }
    s.coins -= spec.price;
    const b = { id: `building-${s.nextId++}`, type, x, y, health: 100 };
    s.buildings.push(b);
    if (type === "house")
      s.npcs.push({
        id: `resident-${b.id}`,
        name: `Neighbor ${s.buildings.filter((b) => b.type === "house").length}`,
        role: "Neighbor",
        x: x + 65,
        y: y + 35,
        intent: "Settling into the valley",
        timer: 0,
      });
    this.award(type === "wall" ? 2 : 30);
    this.notify(
      `${spec.name} built. Settlement population: ${this.population}.`,
    );
    return true;
  }
  repair(id) {
    const b = this.state.buildings.find((b) => b.id === id);
    if (!b || b.health >= 100)
      return this.notify("This structure is in good condition.");
    if (!this.canAfford(5, `${BUILDINGS[b.type].name} repairs`)) return;
    this.state.coins -= 5;
    b.health = 100;
    return this.notify("Structure repaired.");
  }
  invitePartner(kind) {
    const s = this.state;
    if (!["human", "robot"].includes(kind) || s.family.partner)
      return this.notify("Your household already has a companion.");
    const home = s.buildings.find((b) => b.type === "house" && b.health > 0);
    if (!home)
      return this.notify("Build a cottage before inviting a companion.");
    const cost = kind === "robot" ? 100 : 0;
    if (!this.canAfford(cost, 'Ari-7')) return;
    s.coins -= cost;
    s.family.partner = kind;
    s.npcs.push({
      id: "partner",
      name: kind === "robot" ? "Ari-7" : "Lena",
      role: kind === "robot" ? "Robot companion" : "Adult companion",
      x: home.x + 50,
      y: home.y + 30,
      intent: "Getting to know the valley",
      timer: 0,
    });
    return this.notify(
      kind === "robot"
        ? "Ari-7 joins your household."
        : "Lena accepted your invitation to visit the settlement.",
    );
  }
  bond() {
    const s = this.state,
      f = s.family;
    if (!f.partner) return this.notify("Invite a companion first.");
    if (s.time - f.lastGift < 30)
      return this.notify(
        "Spend some time in the valley before your next shared meal.",
      );
    if (s.food < 2)
      return this.notify("Prepare two bundles of food for a shared meal.");
    s.food -= 2;
    f.bond = Math.min(100, f.bond + 25);
    f.lastGift = s.time;
    this.award(15);
    return this.notify(
      `Shared meal · bond ${f.bond}/100. ${f.bond === 100 ? "Your companion would like to build a family together." : "A friendship grows with time."}`,
    );
  }
  startFamily(design='hybrid') {
    const s = this.state,
      f = s.family;
    if (!f.partner || f.bond < 100 || this.level < 3)
      return this.notify(
        "Reach level 3 and bond 100. Both companions must be ready.",
      );
    if (f.child || f.arrival !== null)
      return this.notify("Your family chapter is already underway.");
    if (!this.canAfford(80, 'a family room')) return;
    s.coins -= 80;
    f.childDesign=f.partner==='robot'&&design==='robot'?'robot':f.partner==='robot'?'hybrid':'human';
    f.arrival = 90;
    return this.notify(
      f.partner === "robot"
        ? "Both companions agree. The lab begins the hybrid family chapter."
        : "Both companions agree. Preparations for a new family member begin.",
    );
  }
  requestVet(id) {
    const cow = this.state.cows.find((c) => c.id === id),
      vet = this.state.npcs.find((n) => n.id === "vet");
    if (!cow) return this.notify("Choose a cow for the breeding robot.");
    if (cow.growth < 100)
      return this.notify("This calf needs to reach adulthood first.");
    if (cow.health < 75 || cow.hunger < 50 || cow.thirst < 50)
      return this.notify("Care for this cow before requesting a visit.");
    if (cow.pregnancy !== null || cow.vetRequested || cow.rest > 0)
      return this.notify(
        "This cow is pregnant, awaiting a visit, or resting after birth.",
      );
    if (vet.target) return this.notify("B.O.V.I. is already on a visit.");
    if (!this.canAfford(25, 'a B.O.V.I. insemination visit')) return;
    this.state.coins -= 25;
    cow.vetRequested = true;
    vet.target = cow.id;
    vet.intent = `Visiting ${cow.name}`;
    return this.notify(
      `B.O.V.I. is on her way to ${cow.name}. One calf slot reserved.`,
    );
  }
  cast(spell) {
    const spec = SPELLS[spell]||SPELL_SCROLLS[spell],
      s = this.state;
    if(SPELL_SCROLLS[spell]&&!s.spellScrolls.includes(spell))return this.notify('Buy this spell scroll first.');
    if (!spec || this.level < spec.level)
      return this.notify(`Unlock this spell at level ${spec?.level || 1}.`);
    if ((s.cooldowns[spell] || 0) > s.time)
      return this.notify("This spell is still recharging.");
    if (s.mana < spec.mana)
      return this.notify("Give your mana a moment to recover.");
    const enemies=s.wolves.filter(w=>!w.dead&&!w.retreat&&distance(w,s.player)<=320).sort((a,b)=>distance(a,s.player)-distance(b,s.player));
    if(['fire','lightning'].includes(spell)&&!enemies.length)return this.notify('No enemy within spell range.');
    s.player.expression='focused';s.player.expressionUntil=s.time+1.5;
    s.mana-=spec.mana;s.cooldowns[spell]=s.time+spec.cooldown;
    const source={x:s.player.x+22,y:s.player.y-30};
    const effect=(kind,t)=>s.effects.push({kind,x:t.x,y:t.y,start:s.time,until:s.time+1.5});
    if(spell==='fire'){const target=enemies[0];target.id??=this.id();s.projectiles.push({...source,kind:'fireball',source:{...source},target:target.id,start:s.time,power:4,stun:0,speed:420});}
    if(spell==='lightning')for(const w of enemies.slice(0,4)){this.damageEnemy(w,4);s.effects.push({kind:'electric',...source,exactOrigin:true,tx:w.x,ty:w.y-20,start:s.time,until:s.time+.5});}
    if(spell==='frost')s.effects.push({kind:'frost-wave',x:s.player.x,y:s.player.y,start:s.time,until:s.time+1,hit:[]});
    if(spell==='rain'){
      for(const a of [...s.cows,...s.animals])if(distance(a,s.player)<320){a.thirst=Math.min(100,a.thirst+35);effect('rain-target',a);}
      for(const p of s.crops){p.water=100;effect('rain-target',p);}
    }
    if(spell==='bloom'){
      for(const p of s.crops)if(p.type){p.growth=Math.min(100,p.growth+35);effect('bloom-target',p);}
      for(const a of s.cows)if(distance(a,s.player)<320){a.growth=Math.min(100,a.growth+12);effect('bloom-target',a);}
    }
    if(spell==='sanctuary')s.sanctuaryUntil=s.time+12;
    return this.notify(spec.name);
  }
  persuasionOptions(id){
    const n=this.state.npcs.find(n=>n.id===id);if(!n)return [];
    const hash=[...n.id].reduce((sum,c)=>sum+c.charCodeAt(0),0),used=n.persuasionUsed||[];
    return ['admire','joke','boast','intimidate'].map((key,i)=>({key,name:['Admire','Joke','Boast','Intimidate'][i],strength:1+(i+used.length)%4,preference:this.socialPreference(n,key,[2,1,-1,-2][(i+hash)%4]),used:used.includes(key)}));
  }
  socialPreference(n,key,base){
    const threatened=this.state.wolves.some(w=>!w.dead&&!w.retreat&&distance(w,n)<340);
    if(threatened&&['joke','boast'].includes(key))return -2;
    if(key==='intimidate'&&(n.connection??0)>=60)return -2;
    if(key==='admire'&&(n.happiness??65)<35)return Math.max(1,base);
    return base;
  }
  rememberSocial(n,key){
    n.socialMemory??={counts:{}};n.socialMemory.counts??={};
    const repeats=n.socialMemory.lastChoice===key?n.socialMemory.streak||1:0;
    n.socialMemory.counts[key]=(n.socialMemory.counts[key]||0)+1;n.socialMemory.lastChoice=key;n.socialMemory.streak=repeats+1;
    return 1/(1+repeats*.5);
  }
  persuade(id,key){
    const s=this.state,n=s.npcs.find(n=>n.id===id);if(!n)return;
    if(distance(s.player,n)>180)return this.notify('Walk closer to persuade.');
    if((n.persuasionReady??0)>s.time)return this.notify('Give this conversation a moment before another round.');
    const option=this.persuasionOptions(id).find(o=>o.key===key&&!o.used);if(!option)return;
    n.persuasionUsed??=[];n.persuasionUsed.push(key);
    const familiarity=this.rememberSocial(n,key);const change=Math.round(option.preference*option.strength*(option.preference>0?familiarity:1));n.connection=Math.max(0,Math.min(100,(n.connection??0)+change));
    n.happiness=Math.max(0,Math.min(100,(n.happiness??65)+change/2));n.expression=change>0?'happy':'determined';n.expressionUntil=s.time+3;
    const line=change>0?'You know how to talk to me.':'That did not go down well.';
    s.effects.push({kind:'speech',text:line,x:n.x,y:n.y-100,until:s.time+3});
    this.notify(`${n.name}: ${line} Connection ${change>0?'+':''}${change}.`);
    if(n.persuasionUsed.length===4){n.persuasionUsed=[];n.persuasionReady=s.time+20;}
  }
  talk(id,choice='greet'){
    const s=this.state,n=s.npcs.find(n=>n.id===id);if(!n)return;
    if(distance(s.player,n)>180)return this.notify('Walk closer to talk.');
    if(s.time-(n.lastTalk??-100)<20)return this.notify(`${n.name}: Let's chat again in a little while.`);
    if(!['greet','joke','farm'].includes(choice))return;
    const familiarity=this.rememberSocial(n,choice);
    const threatened=s.wolves.some(w=>!w.dead&&!w.retreat&&distance(w,n)<340);
    n.connection=Math.max(0,Math.min(100,(n.connection??0)+(threatened&&choice==='joke'?-3:Math.round((choice==='joke'?6:choice==='farm'?2:4)*familiarity))));
    n.lastTalk=s.time;n.happiness=Math.min(100,(n.happiness??65)+(choice==='joke'?15:choice==='farm'?6:12));s.player.happiness=Math.min(100,(s.player.happiness??65)+6);
    n.expression='happy';n.expressionUntil=s.time+4;s.player.expression='happy';s.player.expressionUntil=s.time+4;
    const text=threatened?'There are enemies nearby. Help us defend the farm first!':n.socialMemory.streak>=3?'We have talked about that a few times. Tell me something different.':choice==='greet'&&(n.connection??0)>=60?'My friend! I was hoping you would stop by.':choice==='joke'?'Ha! That was a good one. Even the sheep would laugh.':choice==='farm'?`I am ${n.intent||'watching the farm'}. We can do more when we help each other.`:n.happiness<40?'I am worried about the farm. Thank you for checking on me.':n.happiness>=80?'It is lovely living here with you!':'Thanks for stopping by. Working together makes this place feel like home.';
    if(threatened){n.expression='determined';n.expressionUntil=s.time+4;}
    s.effects.push({kind:'speech',text,x:n.x,y:n.y-100,until:s.time+4});this.notify(`${n.name}: ${text}`);
  }
  moveTo(actor, target, speed, dt) {
    const d = distance(actor, target);
    if (d < 2) return;
    const step = Math.min(d, speed * dt);
    actor.x += ((target.x - actor.x) / d) * step;
    actor.y += ((target.y - actor.y) / d) * step;
  }
  tick(dt) {
    dt = clamp(dt, 0, 0.25);
    const s = this.state;
    s.time += dt;
    const animals=[...s.cows,...s.animals];
    const wellbeing=animals.length?animals.reduce((sum,a)=>sum+(a.hunger+a.thirst)/2,0)/animals.length:70;
    for(const n of [s.player,...s.npcs]){
      n.happiness??=65;
      const danger=s.wolves.some(w=>!w.dead&&!w.retreat&&distance(n,w)<340);
      const social=s.time-(n.lastTalk??-100)<60?15:0;
      const desired=Math.max(10,Math.min(95,wellbeing+social-(danger?45:0)));
      n.happiness+=Math.max(-dt*.6,Math.min(dt*.35,(desired-n.happiness)*dt*.05));
    }
    const chatting=new Set();
    for(const n of s.npcs.filter(n=>n.id!=='vet')){
      if(chatting.has(n.id)||s.time-(n.lastSocial??0)<25||/Defend|Driving/.test(n.intent||''))continue;
      const other=s.npcs.find(a=>a!==n&&a.id!=='vet'&&!chatting.has(a.id)&&s.time-(a.lastSocial??0)>=25&&distance(n,a)<100&&!/Defend|Driving/.test(a.intent||''));
      if(!other)continue;
      for(const a of [n,other]){chatting.add(a.id);a.lastSocial=s.time;a.happiness=Math.min(100,(a.happiness??65)+4);a.expression='happy';a.expressionUntil=s.time+4;}
      s.effects.push({kind:'speech',text:`${other.name}, how is your day going?`,x:n.x,y:n.y-100,until:s.time+2});
      s.effects.push({kind:'speech',text:'Better with good company!',x:other.x,y:other.y-100,startsAt:s.time+2,until:s.time+4});
    }
    s.mana = Math.min(100, s.mana + dt * 3);
    for(const arrow of s.projectiles){
      const target=s.wolves.find(w=>w.id===arrow.target&&!w.dead);
      if(!target){arrow.done=true;continue;}
      const aim={x:target.x,y:target.y-20};
      arrow.angle=Math.atan2(aim.y-arrow.y,aim.x-arrow.x);
      this.moveTo(arrow,aim,arrow.speed||520,dt);
      if(distance(arrow,aim)<8){
        this.damageEnemy(target,arrow.power);if(arrow.kind==='fireball')s.effects.push({kind:'explosion',x:target.x,y:target.y-20,start:s.time,until:s.time+.6});target.frozen=Math.max(target.frozen||0,arrow.stun);
        if(arrow.chain)for(const other of s.wolves.filter(w=>w!==target&&!w.dead&&distance(w,target)<arrow.chain))this.damageEnemy(other,1.5);
        arrow.done=true;
      }
    }
    for(const wave of s.effects.filter(e=>e.kind==='frost-wave')){
      const radius=Math.min(320,(s.time-wave.start)*320);
      for(const w of s.wolves)if(!w.dead&&!wave.hit.includes(w)&&distance(w,wave)<=radius){w.frozen=6+dt;wave.hit.push(w);}
    }
    s.projectiles=s.projectiles.filter(a=>!a.done);
    s.wolves=s.wolves.filter(w=>!w.dead);
    s.lootDrops=s.lootDrops.filter(drop=>{
      if(distance(drop,s.player)>55)return true;
      s.loot[drop.type]=(s.loot[drop.type]||0)+1;
      this.notify(`Collected ${LOOT[drop.type].name} · sell at General Store → Monster loot.`);return false;
    });
    s.effects = s.effects.filter((e) => e.until > s.time);
    s.notices = s.notices.filter((e) => e.until > s.time);
    for (const p of s.crops) {
      p.water = Math.max(0, p.water - dt * 0.15);
      if (p.type && p.water > 10)
        p.growth = Math.min(100, p.growth + dt * CROPS[p.type].growRate);
    }
    for (const cow of [...s.cows]) {
      cow.hunger = Math.max(0, cow.hunger - dt * 0.22);
      cow.thirst = Math.max(0, cow.thirst - dt * 0.3);
      cow.rest = Math.max(0, cow.rest - dt);
      if(cow.growth>=100&&cow.hunger>35&&cow.thirst>35)cow.milk=Math.min(8,(cow.milk||0)+dt/35);
      if (cow.hunger > 40 && cow.thirst > 40) {
        cow.growth = Math.min(100, cow.growth + dt * 0.6);
        cow.health = Math.min(
          100,
          cow.health +
            dt *
              (s.buildings.some(
                (b) =>
                  b.type === "barn" && b.health > 0 && distance(b, cow) < 220,
              )
                ? 1
                : 0.2),
        );
      }
      if (cow.pregnancy !== null) {
        cow.pregnancy += dt;
        if (cow.pregnancy >= 100) {
          cow.pregnancy = null;
          cow.rest = 90;
          this.addCow({ x: cow.x + 25, y: cow.y + 25 });
          s.births++;
          this.award(80);
          this.notify("+80 XP · A new calf joins the herd!");
        }
      }
      const threat = s.wolves.find((w) => !w.retreat && distance(w, cow) < 220);
      if (threat) {
        cow.intent = "Seeking shelter";
        this.moveTo(cow, { x: 800, y: 380 }, 65, dt);
      } else if (cow.thirst < 40) {
        cow.intent = "Finding water";
        this.moveTo(cow, { x: 1140, y: 820 }, 32, dt);
        if (distance(cow, { x: 1140, y: 820 }) < 80)
          cow.thirst = Math.min(100, cow.thirst + dt * 5);
      } else {
        cow.intent = cow.pregnancy !== null ? "Expecting a calf" : "Grazing";
        cow.timer -= dt;
        if (cow.timer <= 0) {
          cow.goal = {
            x: 700 + this.random() * 620,
            y: 440 + this.random() * 360,
          };
          cow.timer = 5 + this.random() * 6;
        }
        this.moveTo(cow, cow.goal, 12, dt);
      }
    }
    const vet = s.npcs.find((n) => n.id === "vet");
    if (vet.target) {
      const cow = s.cows.find((c) => c.id === vet.target);
      if (cow) {
        this.moveTo(vet, cow, 95, dt);
        if (distance(vet, cow) < 35) {
          cow.vetRequested = false;
          cow.pregnancy = 0;
          vet.target = null;
          vet.intent = "Visit complete";
          this.award(20);
          this.notify(`${cow.name} is expecting. Keep her comfortable.`);
        }
      } else vet.target = null;
    }
    const farmer = s.npcs.find((n) => n.id === "farmer");
    farmer.timer -= dt;
    const needy = [...s.cows,...s.animals.filter(a=>a.kind!=='dog')].sort(
      (a, b) => Math.min(a.hunger, a.thirst) - Math.min(b.hunger, b.thirst),
    )[0];
    if (needy && Math.min(needy.hunger, needy.thirst) < 55) {
      farmer.intent = `Helping ${needy.name}`;
      this.moveTo(farmer, needy, 65, dt);
      if (distance(farmer, needy) < 45 && farmer.timer <= 0) {
        if (needy.thirst < needy.hunger)
          needy.thirst = Math.min(100, needy.thirst + 20);
        else needy.hunger = Math.min(100, needy.hunger + 20);
        farmer.timer = 12;
      }
    } else farmer.intent = "Checking every animal and the garden";
    const shepherd = s.npcs.find((n) => n.id === "shepherd");
    const danger = s.wolves.find((w) => !w.retreat);
    shepherd.intent = danger ? "Driving wolves away" : "Patrolling the pasture";
    shepherd.timer=Math.max(0,(shepherd.timer||0)-dt);
    if (danger) {
      this.moveTo(shepherd, danger, 60, dt);
      if (distance(shepherd, danger) < 60 && shepherd.timer<=0) {this.damageEnemy(danger,1.5);danger.frozen=1;shepherd.timer=2;}
    }
    if (s.family.arrival !== null) {
      s.family.arrival -= dt;
      if (s.family.arrival <= 0) {
        s.family.arrival = null;
        s.family.child = s.family.childDesign || (s.family.partner === "robot" ? "hybrid" : "human");
        const home = s.buildings.find((b) => b.type === "house") || {
          x: 750,
          y: 400,
        };
        s.npcs.push({
          id: "child",
          name: s.family.child === 'robot'?'Bolt':s.family.child === "hybrid" ? "Nova" : "Robin",
          role: s.family.child === 'robot'?'Robot child':s.family.child === "hybrid" ? "Human–robot child" : "Child",
          x: home.x + 30,
          y: home.y + 20,
          intent: "Playing safely at home",
          timer: 0,
        });
        this.award(100);
        this.notify("A new family chapter · welcome home, little one.");
      }
    }
    for (const a of s.animals) {
      a.timer -= dt;
      if(a.kind !== 'dog'){
        a.hunger=Math.max(0,a.hunger-dt*.14);
        a.thirst=Math.max(0,a.thirst-dt*.2);
      }
      if(a.kind==='sheep'&&a.growth<100&&a.hunger>35&&a.thirst>35){
        a.growth=Math.min(100,a.growth+dt*.75);
        a.intent=a.growth>=100?'Joined the adult flock':'Growing beside the flock';
      }
      if(a.kind==='chicken'){
        a.eggTimer=(a.eggTimer??60)-dt;
        if(a.eggTimer<=0){const gold=a.golden||this.random()<.025;if(gold)a.goldenEggs=(a.goldenEggs||0)+1;else a.eggs=(a.eggs||0)+1;a.eggTimer=45+this.random()*45;a.intent=gold?'Laid a golden egg!':'An egg is ready';if(gold)this.notify(`${a.name||'A chicken'} laid a golden egg! Sell it or hatch a golden chick.`);}
      }
      if (a.kind === "dog") {
        a.intent = danger ? "Guarding the herd" : "Following you";
        this.moveTo(
          a,
          danger || { x: s.player.x - 50, y: s.player.y + 30 },
          90,
          dt,
        );
      } else {
        if (a.timer <= 0) {
          a.goal = {
            x: a.homeX + this.random() * 140 - 70,
            y: a.homeY + this.random() * 140 - 70,
          };
          a.timer = 4 + this.random() * 4;
        }
        this.moveTo(a, a.goal, a.kind === "chicken" ? 22 : 15, dt);
      }
    }
    if(s.time >= (s.nextSheepBirth??150)){
      const adults=s.animals.filter(a=>a.kind==='sheep'&&(a.growth??100)>=100&&a.hunger>35&&a.thirst>35);
      if(adults.length>=2){
        const mother=adults[Math.floor(this.random()*adults.length)];
        const lamb=this.addSheep({x:mother.x+25,y:mother.y+18});
        if(lamb){s.births++;this.award(45);this.notify(`${lamb.name} was born! Keep the flock fed and watered · +45 XP.`);}
        s.nextSheepBirth=s.time+150+this.random()*90;
      } else s.nextSheepBirth=s.time+30;
    }
    tickTeamwork(this,dt,CROPS);
    tickEngineering(this,dt);
    for (const w of s.wolves) {
      if(w.dead)continue;
      w.frozen = Math.max(0, w.frozen - dt);
      if (w.frozen) continue;
      if (w.retreat > 0) {
        w.retreat -= dt;
        this.moveTo(w, { x: 1550, y: 200 }, 110, dt);
      } else {
        const defender = s.guards.filter(g=>g.health>0 && distance(g,w)<150).sort((a,b)=>distance(a,w)-distance(b,w))[0];
        if(defender) {
          this.moveTo(w,defender,45,dt);w.intent='Attacking the guardian';
          if(distance(w,defender)<45&&s.sanctuaryUntil<=s.time) defender.health=Math.max(0,defender.health-dt*12);
          continue;
        }
        const target = [...s.cows].sort(
          (a, b) => distance(a, w) - distance(b, w),
        )[0];
        if (target) {
          const obstacle = s.buildings.find(
            (b) =>
              b.health > 0 &&
              distance(w, b) < BUILDINGS[b.type].size + 20 &&
              distance(b, target) < distance(w, target),
          );
          if (obstacle) {
            obstacle.health = Math.max(
              0,
              obstacle.health - (s.sanctuaryUntil>s.time?0:dt * (obstacle.type === "wall" ? 5 : 3)),
            );
            w.intent = "Breaking through";
          } else {
            this.moveTo(w, target, (w.speed||28) + Math.min(15, this.threat * 2), dt);
            w.intent = "Hunting";
          }
          if (distance(w, target) < 35)
            target.health = Math.max(15, target.health - (s.sanctuaryUntil>s.time?0:dt * (w.damage||2)));
        }
      }
    }
    s.wolves = s.wolves.filter((w) => w.x < 1500);
    if (s.nextWave - s.time <= 10 && s.nextWave - (s.time - dt) > 10)
      this.notify(
        `Howls at the edge of the valley. Threat ${this.threat} · reinforce your walls.`,
      );
    if (s.time >= s.nextWave) {
      s.wave++;
      const count = Math.min(10, this.threat+1);
      for (let i = 0; i < count && s.wolves.length < 12; i++){
        const type=this.level>=5&&this.threat>=6&&i%3===0?'vampire':this.level>=3&&this.threat>=4&&i%2===0?'direwolf':'wolf';
        const spec=type==='vampire'?{courage:10,speed:42,damage:7}:type==='direwolf'?{courage:6,speed:34,damage:4}:{courage:3,speed:28,damage:2};
        s.wolves.push({ id:this.id(),health:spec.courage,maxHealth:spec.courage,type, ...spec, x: 1460, y: 440 + i * 55, frozen: 0, retreat: 0 });
      }
      s.nextWave = s.time + Math.max(25, 60 - this.threat * 4);
      this.notify(`Wave ${s.wave} · ${count} wolves approach your settlement.`);
    }
  }
  market(id) {
    const s = this.state,
      c = s.cows.find((c) => c.id === id);
    if (
      !c ||
      c.growth < 100 ||
      c.pregnancy !== null ||
      c.vetRequested ||
      s.cows.length <= 1
    )
      return this.notify(
        "Keep at least one cow. Only adult cows without a pending calf can go to market.",
      );
    s.cows = s.cows.filter((a) => a.id !== id);
    s.coins += 70;
    s.deliveries++;
    this.award(25);
    s.selected = null;
    return this.notify("Market delivery complete · +70 coins, +25 XP.");
  }
  marketSheep(id) {
    const s=this.state, sheep=s.animals.find(a=>a.id===id&&a.kind==='sheep');
    if(!sheep||(sheep.growth??100)<100)return this.notify('Only an adult sheep can go to market.');
    s.animals=s.animals.filter(a=>a.id!==id);
    s.coins+=45;s.livestockSales++;s.deliveries++;s.selected=null;this.award(20);
    return this.notify('Sheep market delivery complete · +45 gold, +20 XP.');
  }
  save() {
    const { effects, notices, ...data } = this.state;
    return JSON.stringify(data);
  }
  load(json) {
    try {
      const d = JSON.parse(json);
      if (
        d.version !== 1 ||
        !Array.isArray(d.cows) ||
        d.cows.length < 1 ||
        d.cows.length + (d.animals?.length || 0) > ANIMAL_SAFETY_GUARD ||
        !Array.isArray(d.animals) ||
        !Array.isArray(d.crops) ||
        !Array.isArray(d.npcs) ||
        !Array.isArray(d.wolves) ||
        !Array.isArray(d.completed) ||
        !d.player ||
        ![
          d.time,
          d.xp,
          d.coins,
          d.mana,
          d.food,
          d.nextId,
          d.player.x,
          d.player.y,
        ].every(Number.isFinite)
      )
        return false;
      for (const c of d.cows)
        if (
          ![c.x, c.y, c.growth, c.health, c.hunger, c.thirst].every(
            Number.isFinite,
          )
        )
          return false;
      if ((d.buildings?.length || 0) > BUILDING_SAFETY_GUARD) return false;
      d.projectiles=[];d.lootDrops??=[];d.loot??={};
      d.seeds ||= { clover: 2, carrot: 1, wheat: 1 };
      d.produce ||= { clover: 0, carrot: 0, wheat: 0 };
      for(const id of Object.keys(CROPS)){d.seeds[id]??=0;d.produce[id]??=0;}
      d.eggs??=0;d.goldenEggs??=0;d.milk??=0;d.livestockSales??=0;d.farmUpgrades??=[];d.landExpansions??=0;d.specialAmmo??=null;d.specialAmmoOwned??=[];d.spellScrolls??=[];d.sanctuaryUntil??=0;
      for(const a of d.animals)if(a.kind==='chicken'){a.eggTimer??=45+this.random()*45;a.eggs??=0;a.goldenEggs??=0;a.golden??=false;}
      for(const a of d.animals)if(a.kind==='sheep')a.growth??=100;
      d.nextSheepBirth??=d.time+150;
      for(const c of d.cows)c.milk??=0;
      d.sales ||= 0;
      d.buildings ||= [];
      d.weapon ||= "staff";
      d.weapons ||= ["staff"];
      if(!d.weapons.includes('shortsword'))d.weapons.push('shortsword');
      if(d.weapon==='staff')d.weapon='shortsword';
      d.lastAttack ??= -10;
      d.family ||= {
        partner: null,
        bond: 0,
        lastGift: -60,
        child: null,
        arrival: null,
      };
      d.wave ||= 0;
      d.nextWave = Math.min(d.nextWave??d.time+35,d.time+35);
      for (const p of d.crops) if (p.type === undefined) p.type = "clover";
      if(!migrateEngineering(d))return false;
      this.state = { ...d, effects: [], notices: [] };
      return true;
    } catch {
      return false;
    }
  }
}
