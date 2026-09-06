import test from "node:test";
import assert from "node:assert/strict";
import { World } from "../src/world.js";
const advance = (w, n) => {
  for (let i = 0; i < n * 4; i++) w.tick(0.25);
};
test('insufficient funds uses the actual item name and exact shortfall without charging', () => {
  const w = new World();
  w.state.coins = 100;
  assert.equal(w.build('barn', 640, 840), false);
  assert.equal(w.state.notices[0].text, 'Insufficient funds — you need 10 more gold to buy Barn.');
  assert.equal(w.state.coins, 100);
  assert.equal(w.state.buildings.length, 0);
  w.state.coins = 2;
  const seeds = w.state.seeds.carrot;
  w.buySeed('carrot');
  assert.match(w.state.notices[0].text, /3 more gold to buy Carrot seeds/);
  assert.equal(w.state.seeds.carrot, seeds);
  w.equip('bow');
  assert.match(w.state.notices[0].text, /63 more gold to buy/);
  assert.equal(w.state.coins, 2);
  w.state.coins = 5;
  w.buySeed('carrot');
  assert.equal(w.state.coins, 0);
  assert.equal(w.state.seeds.carrot, seeds + 1);
});
test("buy, plant, grow, harvest and sell has a positive, finite economy", () => {
  const w = new World(),
    s = w.state;
  w.buySeed("carrot");
  assert.equal(s.coins, 95);
  s.player = { x: s.crops[4].x, y: s.crops[4].y };
  w.plant(4, "carrot");
  assert.equal(s.seeds.carrot, 1);
  advance(w, 95);
  w.harvest(4);
  assert.equal(s.produce.carrot, 3);
  assert.equal(s.crops[4].type, null);
  w.sellProduce("carrot");
  assert.equal(s.coins, 110);
  assert.equal(s.produce.carrot, 0);
  const coins = s.coins;
  w.sellProduce("carrot");
  assert.equal(s.coins, coins);
});
test("construction costs coins, prevents overlap and scales waves with settlement", () => {
  const w = new World(),
    s = w.state;
  s.coins = 1000;
  assert.ok(w.build("house", 640, 840));
  assert.equal(w.population, 6);
  assert.equal(s.coins, 925);
  assert.equal(w.build("house", 640, 840), false);
  assert.equal(s.coins, 925);
  assert.ok(w.build("wall", 960, 720));
  const threat = w.threat;
  s.nextWave = 0.1;
  w.tick(0.2);
  assert.equal(s.wolves.length, threat);
});
test("walls block and take damage, repairs restore them", () => {
  const w = new World(),
    s = w.state;
  s.cows[0].x = 800;
  s.cows[0].y = 600;
  s.cows[1].x = 750;
  s.cows[1].y = 600;
  s.buildings.push({ id: "wall", type: "wall", x: 960, y: 600, health: 100 });
  s.wolves.push({ x: 980, y: 600, frozen: 0, retreat: 0 });
  s.npcs[1].x = 200;
  w.tick(0.25);
  assert.ok(s.buildings[0].health < 100);
  assert.equal(s.wolves[0].x, 980);
  w.repair("wall");
  assert.equal(s.buildings[0].health, 100);
});
test("weapons require purchase and attacks drive wolves away with rewards once", () => {
  const w = new World(),
    s = w.state;
  w.equip("sword");
  assert.equal(s.coins, 15);
  w.equip("sword");
  assert.equal(s.coins, 15);
  s.wolves.push({ x: s.player.x + 20, y: s.player.y, frozen: 0, retreat: 0 });
  w.attack();
  s.time += 1;
  w.attack();
  assert.ok(s.wolves[0].retreat > 0);
  assert.equal(s.xp, 20);
  s.time += 1;
  w.attack();
  assert.equal(s.xp, 20);
});
test("family requires a home, bond, level and resources; robot route creates hybrid child", () => {
  const w = new World(),
    s = w.state;
  w.invitePartner("robot");
  assert.equal(s.family.partner, null);
  s.coins = 1000;
  w.build("house", 640, 840);
  w.invitePartner("robot");
  assert.equal(s.family.partner, "robot");
  w.startFamily();
  assert.equal(s.family.arrival, null);
  s.xp = 400;
  for (let i = 0; i < 4; i++) {
    w.bond();
    s.time += 31;
  }
  assert.equal(s.family.bond, 100);
  w.startFamily();
  assert.equal(s.family.arrival, 90);
  advance(w, 91);
  assert.equal(s.family.child, "hybrid");
  assert.ok(s.npcs.find((n) => n.id === "child"));
  const copy = new World();
  assert.ok(copy.load(w.save()));
  assert.equal(copy.state.family.child, "hybrid");
});
