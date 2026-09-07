# From Cow to Beef

A standalone farm-building action RPG for desktop and touch browsers. Grow a peaceful herd, cultivate crops, build a settlement and defend it with weapons and magic. Processing a cow is optional; care, farming, quests and breeding all earn experience.

## Play

[Play From Cow to Beef](https://from-cow-to-beef.meat-lover-bc0.workers.dev/)

[Source repository](https://github.com/9khfghvzzw-dotcom/from-cow-to-beef)

![Gameplay: the pasture, household and breeding robot](docs/gameplay.png)

## Features

- Layered canvas landscape, animated animals, depth sorting, shadows and lighting.
- Cows, breeding sheep, egg-laying chickens and a farm dog; sheep can grow and go to market, while a farmer autonomously prioritizes any farm animal in need and residents help defend the settlement.
- Chickens lay sellable eggs, with a rare golden egg that can be sold or hatched into a golden chicken. Adult cows produce collectible, sellable milk without being sent to market.
- Six spells, including purchasable lightning and sanctuary magic, plus three permanent special-arrow upgrades.
- XP, levels and quests. A breeding robot travels to a healthy adult cow, performs artificial insemination and starts a timed pregnancy. Herds and settlements have no gameplay cap.
- A General Store organized into seeds/produce, homes/defenses, weapons and household categories.
- Plant clover, carrots, wheat, tea and valuable saffron; buy up to three extra fields with six plots each.
- Place cottages, barns and defensive walls. Settlement growth and player level increase enemy pressure from wolves, dire wolves and high-level vampires. Buy an expanding weapon roster or electric Voltwarden robots to defend the herd.
- An optional household story with an adult human or robot companion, shared meals, and a human, hybrid or android child who helps defend the settlement.
- Original soundtrack supplied by the project owner, with an explicit sound toggle.
- Local saves, pause, field guide, keyboard, mouse and touch controls. All shop purchases use earned game coins.

## Controls

| Action                   | Control                                                    |
| ------------------------ | ---------------------------------------------------------- |
| Move                     | WASD / arrows, click ground, or touch direction buttons    |
| Interact                 | Select an animal, crop or building; use the action panel   |
| Spells                   | 1–4 or spell buttons                                       |
| Attack wolves            | F or Attack                                                |
| Build                    | Select a building in General Store, then click open ground |
| Pause / cancel placement | Escape                                                     |

## Run locally

Requires Node.js compatible with Vite 8 (tested with Node 24).

```sh
npm ci
npm run dev
npm test
npm run build
```

The development server uses `http://127.0.0.1:5180/`. Production output is in `dist/`; upload its contents as Cloudflare Worker static assets. No backend, API keys or paid services are required by the game.

To update the existing Cloudflare deployment with an authorized account:

```sh
npm run build
npx wrangler@4.129.0 deploy
```

`wrangler.jsonc` identifies this game's standalone Worker. For your own deployment, change its account ID and Worker name. Cloudflare authentication is stored outside the repository.

## Architecture and validation

- `src/world.js`: browser-independent simulation, economy, NPC decisions, combat, breeding and persistence.
- `src/render.js`: canvas rendering and camera.
- `src/main.js`: input, HUD, audio and save lifecycle.
- `src/dom.js`: incremental updates that preserve live interaction controls.
- `src/settlement-ui.js`: categorized store and settlement actions.
- `tests/`: deterministic Node tests covering progression, breeding reservations, NPCs, spells, crops, construction, combat, household and save validation.

Validation: 30 passing simulation tests and a successful production build. The tests cover progression, animal care, sheep breeding and sales, eggs and golden chickens, dairy production, land expansion, premium crops, advanced magic and arrows, android defense, stronger level-scaled enemies, engineering, repair costs and save migration.

[Mobile screenshot](docs/mobile.png)

Time stops when the tab is hidden, a dialog is open or the game is paused. Saves belong to the current browser and origin; clearing site data removes them. This is a single-player browser game, not a signed native iPhone app. A network connection is needed for initial loading; this release does not claim installable offline support.

Code and artwork are provided here for portfolio review. No redistribution license has been granted for the supplied soundtrack.
