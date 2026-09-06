# From Cow to Beef

A standalone farm-building action RPG for desktop and touch browsers. Grow a peaceful herd, cultivate crops, build a settlement and defend it with weapons and magic. Processing a cow is optional; care, farming, quests and breeding all earn experience.

## Play

[Play From Cow to Beef](https://from-cow-to-beef.meat-lover-bc0.workers.dev/)

[Source repository](https://github.com/9khfghvzzw-dotcom/from-cow-to-beef)

![Gameplay: the pasture, household and breeding robot](docs/gameplay.png)

## Features

- Layered canvas landscape, animated animals, depth sorting, shadows and lighting.
- Cows, sheep, chickens and a farm dog; a farmer prioritizes animals in need and a shepherd responds to wolves.
- Four spells: rain, frost, bloom and fire, with level requirements, mana and cooldowns.
- XP, levels and quests. A breeding robot travels to a healthy adult cow, performs artificial insemination and starts a timed pregnancy. Existing cows and reserved births share a strict 20-slot limit.
- A General Store organized into seeds/produce, homes/defenses, weapons and household categories.
- Plant clover, carrots and wheat; harvest and sell produce or keep clover as feed.
- Place cottages, barns and defensive walls. Settlement growth increases enemy pressure. Buy a bow or sword and defend the herd.
- An optional household story with an adult human or robot companion, shared meals and a human or fictional hybrid child.
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

Validation: 13 passing simulation tests and a successful production build. Browser checks on the public deployment covered care/XP, the robot visit and pregnancy, rain magic, building a cottage, population/threat changes, companion invitation, shared meals, audio toggle, save restoration and product-specific insufficient-funds feedback. The responsive layout was checked at 390 × 844 with visible touch controls and no horizontal overflow; this is not a claim of physical iPhone testing.

[Mobile screenshot](docs/mobile.png)

Time stops when the tab is hidden, a dialog is open or the game is paused. Saves belong to the current browser and origin; clearing site data removes them. This is a single-player browser game, not a signed native iPhone app. A network connection is needed for initial loading; this release does not claim installable offline support.

Code and artwork are provided here for portfolio review. No redistribution license has been granted for the supplied soundtrack.
