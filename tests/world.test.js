import test from "node:test";
import assert from "node:assert/strict";
import { World, CAPACITY, levelFor } from "../src/world.js";
const advance = (w, seconds) => {
  for (let i = 0; i < seconds * 4; i++) w.tick(0.25);
};
test("care and harvest earn persistent XP without processing a cow", () => {
  const w = new World();
  const c = w.state.cows[0];
  w.state.player = { x: c.x, y: c.y };
  w.care(c.id, "feed");
  w.care(c.id, "water");
  w.state.player = { ...w.state.crops[0] };
  w.harvest(0);
  assert.equal(w.state.xp, 42);
  assert.equal(w.state.cows.length, 2);
  assert.equal(w.state.deliveries, 0);
  const copy = new World();
  assert.ok(copy.load(w.save()));
  assert.equal(copy.state.xp, 42);
  assert.equal(levelFor(400), 3);
});
test("robot travels to adult cow then pregnancy produces a calf", () => {
  const w = new World({ random: () => 0.5 }),
    c = w.state.cows[0];
  c.growth = 100;
  w.requestVet(c.id);
  assert.equal(c.pregnancy, null);
  assert.equal(c.vetRequested, true);
  assert.equal(w.reserved, 3);
  advance(w, 15);
  assert.notEqual(c.pregnancy, null);
  advance(w, 105);
  assert.equal(w.state.births, 1);
  assert.equal(w.state.cows.length, 3);
  assert.equal(c.pregnancy, null);
  assert.ok(c.rest > 0);
});
test("immature cows cannot receive insemination and expected calves reserve capacity", () => {
  const w = new World(),
    c = w.state.cows[0];
  w.requestVet(c.id);
  assert.equal(c.vetRequested, false);
  while (w.state.cows.length < 19) w.addCow();
  c.growth = 100;
  w.requestVet(c.id);
  assert.equal(w.reserved, CAPACITY);
  const vet = w.state.npcs.find((n) => n.id === "vet");
  vet.x = c.x;
  vet.y = c.y;
  w.tick(0.1);
  const second = w.state.cows[1];
  second.growth = 100;
  w.requestVet(second.id);
  assert.equal(second.vetRequested, false);
  advance(w, 105);
  assert.equal(w.state.cows.length, CAPACITY);
  assert.equal(w.reserved, CAPACITY);
});
test("spell unlocks, mana and cooldowns enforce distinct effects", () => {
  const w = new World(),
    s = w.state;
  s.player = { x: s.cows[0].x, y: s.cows[0].y };
  s.cows[0].thirst = 20;
  w.cast("rain");
  assert.equal(s.cows[0].thirst, 55);
  assert.equal(s.mana, 82);
  w.cast("rain");
  assert.equal(s.mana, 82);
  w.cast("fire");
  assert.equal(s.mana, 82);
  s.xp = 900;
  s.wolves.push({ x: s.player.x + 10, y: s.player.y, frozen: 0, retreat: 0 });
  w.cast("frost");
  assert.equal(s.wolves[0].frozen, 6);
  w.cast("fire");
  assert.equal(s.wolves[0].retreat, 12);
});
test("farmer prioritizes an animal in need and shepherd responds to threats", () => {
  const w = new World({ random: () => 0.5 }),
    s = w.state,
    c = s.cows[0],
    farmer = s.npcs[0];
  c.hunger = 10;
  farmer.x = c.x;
  farmer.y = c.y;
  w.tick(0.1);
  assert.ok(c.hunger > 20);
  assert.match(farmer.intent, /Helping/);
  s.wolves.push({ x: s.npcs[1].x, y: s.npcs[1].y, frozen: 0, retreat: 0 });
  w.tick(0.1);
  assert.ok(s.wolves[0].retreat > 0);
});
test("market route never removes the last cow or a pregnant cow", () => {
  const w = new World(),
    c = w.state.cows[0];
  c.growth = 100;
  c.pregnancy = 0;
  w.market(c.id);
  assert.equal(w.state.cows.length, 2);
  c.pregnancy = null;
  w.market(c.id);
  assert.equal(w.state.cows.length, 1);
  const last = w.state.cows[0];
  last.growth = 100;
  w.market(last.id);
  assert.equal(w.state.cows.length, 1);
});
test("invalid save is rejected without changing current farm", () => {
  const w = new World();
  assert.equal(w.load("{broken"), false);
  assert.equal(w.load('{"version":1}'), false);
  assert.equal(w.state.cows.length, 2);
});
