import { buyEngineering, startRepair, toggleTechnician, tickEngineering, migrateEngineering } from './engineering.js';
export const CAPACITY = 20;
export const BUILDINGS = {
  house: { name: "Cottage", price: 75, size: 65, population: 3 },
  barn: { name: "Barn", price: 110, size: 75, population: 1 },
  wall: { name: "Stone wall", price: 12, size: 28, population: 0 },
};
export const WEAPONS = {
  shortsword: {name:'Short sword',price:0,range:110,power:1.5,cooldown:.65,description:'Your starting blade. Two quick hits repel a wolf.'},
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
      weapon: "shortsword",
      weapons: ["staff", "shortsword"],
      lastAttack: -10,
      seeds: { clover: 2, carrot: 1, wheat: 1 },
      produce: { clover: 0, carrot: 0, wheat: 0 },
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
        intent: "Exploring",
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
      Math.floor(this.state.cows.length / 5)
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
    if (this.state.cows.length >= CAPACITY) return null;
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
  notify(text) {
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
    s.effects.push({
      kind: "attack",
      x: s.player.x,
      y: s.player.y,
      until: s.time + 0.6,
    });
    const enemy = s.wolves
      .filter((w) => !w.retreat && distance(w, s.player) < spec.range)
      .sort((a, b) => distance(a, s.player) - distance(b, s.player))[0];
    if (!enemy) return this.notify("No wolf within weapon range.");
    const targets=[enemy,...(spec.splash?s.wolves.filter(w=>w!==enemy&&!w.retreat&&distance(w,enemy)<=spec.splash&&distance(w,s.player)<=spec.range).slice(0,2):[])];
    for(const victim of targets){
      victim.courage=(victim.courage??3)-spec.power;
      if(spec.stun)victim.frozen=Math.max(victim.frozen||0,spec.stun);
      if(s.weapon==='blaster')s.effects.push({kind:'electric',x:s.player.x,y:s.player.y-35,tx:victim.x,ty:victim.y-20,until:s.time+.3});
      if(s.weapon==='cryo')s.effects.push({kind:'frost',x:victim.x,y:victim.y,until:s.time+1});
      if(victim.courage<=0){victim.retreat=15;this.award(20);s.coins+=6;}
    }
    this.notify(targets.some(w=>w.retreat)?`${spec.name} repelled ${targets.filter(w=>w.retreat).length} wolf/wolves · +6 gold and +20 XP each.`:`${spec.name} hit · keep the herd safe!`);
  }
  build(type, x, y) {
    const spec = BUILDINGS[type],
      s = this.state;
    if (!spec) return false;
    x = Math.round(x / 40) * 40;
    y = Math.round(y / 40) * 40;
    if (!this.canAfford(spec.price, spec.name)) return false;
    if (s.buildings.length >= 60) {
      this.notify("This valley has room for 60 structures.");
      return false;
    }
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
    if (this.reserved >= CAPACITY)
      return this.notify(
        "The herd is full: 20 cows including expected calves.",
      );
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
    const spec = SPELLS[spell],
      s = this.state;
    if (!spec || this.level < spec.level)
      return this.notify(`Unlock this spell at level ${spec?.level || 1}.`);
    if ((s.cooldowns[spell] || 0) > s.time)
      return this.notify("This spell is still recharging.");
    if (s.mana < spec.mana)
      return this.notify("Give your mana a moment to recover.");
    s.mana -= spec.mana;
    s.cooldowns[spell] = s.time + spec.cooldown;
    s.effects.push({
      kind: spell,
      x: s.player.x,
      y: s.player.y,
      until: s.time + 2,
    });
    if (spell === "rain") {
      for (const c of [...s.cows, ...s.animals])
        if (distance(c, s.player) < 320)
          c.thirst = Math.min(100, c.thirst + 35);
      for (const c of s.crops) c.water = 100;
    }
    if (spell === "bloom") {
      for (const c of s.crops) c.growth = Math.min(100, c.growth + 35);
      for (const c of s.cows)
        if (distance(c, s.player) < 320)
          c.growth = Math.min(100, c.growth + 12);
    }
    for (const w of s.wolves)
      if (distance(w, s.player) < 320) {
        if (spell === "frost") w.frozen = 6;
        if (spell === "fire") {
          w.retreat = 12;
          this.award(8);
        }
      }
    return this.notify(spec.name);
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
    s.mana = Math.min(100, s.mana + dt * 3);
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
        if (cow.pregnancy >= 100 && s.cows.length < CAPACITY) {
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
    const needy = [...s.cows].sort(
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
    } else farmer.intent = "Checking the garden";
    const shepherd = s.npcs.find((n) => n.id === "shepherd");
    const danger = s.wolves.find((w) => !w.retreat);
    shepherd.intent = danger ? "Driving wolves away" : "Patrolling the pasture";
    shepherd.timer=Math.max(0,(shepherd.timer||0)-dt);
    if (danger) {
      this.moveTo(shepherd, danger, 60, dt);
      if (distance(shepherd, danger) < 60 && shepherd.timer<=0) {danger.retreat = 3;shepherd.timer=12;}
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
    for (const n of s.npcs.filter((n) => n.id.startsWith("resident-"))) {
      n.timer -= dt;
      const hurt = s.cows.find((c) => c.health < 70);
      if (hurt) {
        n.intent = `Sheltering ${hurt.name}`;
        this.moveTo(n, hurt, 45, dt);
        if (distance(n, hurt) < 50)
          hurt.health = Math.min(100, hurt.health + dt);
      } else {
        n.intent = "Tending the settlement";
        if (n.timer <= 0) {
          n.goal = {
            x: 650 + this.random() * 500,
            y: 500 + this.random() * 350,
          };
          n.timer = 8;
        }
        this.moveTo(n, n.goal, 20, dt);
      }
    }
    tickEngineering(this,dt);
    for (const w of s.wolves) {
      w.frozen = Math.max(0, w.frozen - dt);
      if (w.frozen) continue;
      if (w.retreat > 0) {
        w.retreat -= dt;
        this.moveTo(w, { x: 1550, y: 200 }, 110, dt);
      } else {
        const defender = s.guards.filter(g=>g.health>0 && distance(g,w)<150).sort((a,b)=>distance(a,w)-distance(b,w))[0];
        if(defender) {
          this.moveTo(w,defender,45,dt);w.intent='Attacking the guardian';
          if(distance(w,defender)<45) defender.health=Math.max(0,defender.health-dt*12);
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
              obstacle.health - dt * (obstacle.type === "wall" ? 5 : 3),
            );
            w.intent = "Breaking through";
          } else {
            this.moveTo(w, target, 28 + Math.min(15, this.threat * 2), dt);
            w.intent = "Hunting";
          }
          if (distance(w, target) < 35)
            target.health = Math.max(15, target.health - dt * 2);
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
      for (let i = 0; i < count && s.wolves.length < 12; i++)
        s.wolves.push({ x: 1460, y: 440 + i * 55, frozen: 0, retreat: 0 });
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
        d.cows.length > CAPACITY ||
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
      if (
        d.cows.length +
          d.cows.filter((c) => c.pregnancy !== null || c.vetRequested).length >
        CAPACITY
      )
        return false;
      d.seeds ||= { clover: 2, carrot: 1, wheat: 1 };
      d.produce ||= { clover: 0, carrot: 0, wheat: 0 };
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
