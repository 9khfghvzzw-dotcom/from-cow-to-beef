import test from 'node:test';
import assert from 'node:assert/strict';
import {World,CROPS} from '../src/world.js';

test('every crop starts with finite stock and can be bought, planted, harvested and sold',()=>{
  for(const [kind,spec] of Object.entries(CROPS)){
    const w=new World(),s=w.state;s.coins=1000;
    assert.ok(Number.isFinite(s.seeds[kind]));assert.equal(s.produce[kind],0);
    const before=s.seeds[kind];w.buySeed(kind);assert.equal(s.seeds[kind],before+1);
    const p=s.crops[0];p.type=null;s.player.x=p.x;s.player.y=p.y;
    w.plant(p.id,kind);assert.equal(s.seeds[kind],before);
    p.growth=100;w.harvest(p.id);assert.equal(s.produce[kind],spec.yield);
    const coins=s.coins;w.sellProduce(kind);assert.equal(s.coins,coins+spec.yield*spec.salePrice);
    w.sellProduce(kind);assert.equal(s.coins,coins+spec.yield*spec.salePrice);
  }
});
test('old and damaged crop inventories recover without changing valid holdings',()=>{
  const w=new World(),d=JSON.parse(w.save());d.seeds.tea=null;delete d.produce.saffron;d.produce.tea=-2;d.seeds.saffron='invalid';d.produce.wheat=7;
  assert.equal(w.load(JSON.stringify(d)),true);
  assert.equal(w.state.seeds.tea,0);assert.equal(w.state.produce.saffron,0);assert.equal(w.state.produce.tea,0);assert.equal(w.state.seeds.saffron,0);assert.equal(w.state.produce.wheat,7);
});
