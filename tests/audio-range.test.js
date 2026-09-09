import test from 'node:test';import assert from 'node:assert/strict';import worker from '../audio-worker.js';
const env={ASSETS:{fetch:async()=>new Response(new Uint8Array([1,2,3,4,5]),{headers:{'Content-Type':'audio/mpeg',ETag:'test'}})}};
test('audio serves bounded and suffix ranges, HEAD, and rejects unsatisfiable ranges',async()=>{
 const call=(range,method='GET')=>worker.fetch(new Request('https://test/audio/test.mp3',{method,headers:range?{Range:range}:{}}),env);
 let r=await call('bytes=1-3');assert.equal(r.status,206);assert.equal(r.headers.get('content-range'),'bytes 1-3/5');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[2,3,4]);
 r=await call('bytes=-2');assert.deepEqual([...new Uint8Array(await r.arrayBuffer())],[4,5]);
 assert.equal((await call('bytes=10-')).status,416);
 r=await call(null,'HEAD');assert.equal(r.headers.get('content-length'),'5');assert.equal((await r.arrayBuffer()).byteLength,0);
 r=await call(null);assert.equal(r.headers.get('accept-ranges'),'bytes');assert.equal((await r.arrayBuffer()).byteLength,5);
});

test('M4A receives range delivery too',async()=>{
 const r=await worker.fetch(new Request('https://test/audio/full.m4a',{headers:{Range:'bytes=0-1'}}),env);
 assert.equal(r.status,206);assert.equal(r.headers.get('content-length'),'2');
});
