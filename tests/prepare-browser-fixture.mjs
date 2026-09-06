// Local-only fixture with a separate save slot, never included by vite build.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
let html=await readFile(new URL('../index.html',import.meta.url),'utf8');
html=html.replace('<script type="module" src="/src/main.js"></script>',`<script type="module">
import {World} from '/src/world.js';
const w=new World({random:()=>.5});w.state.coins=2000;w.state.nextWave=99999;
localStorage.setItem('from-cow-to-beef:qa',w.save());
await import('/src/main.js');
</script>`);
await mkdir(new URL('../.qa/',import.meta.url),{recursive:true});
await writeFile(new URL('../.qa/fixture.html',import.meta.url),html);
