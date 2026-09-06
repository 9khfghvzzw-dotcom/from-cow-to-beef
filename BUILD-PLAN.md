# From Cow to Beef

Standalone browser farm RPG, published publicly on the user's Cloudflare account with a separate real URL. Source in a dedicated GitHub repository suitable for a LinkedIn portfolio. No paid services.

## Required behavior

- Modern cohesive graphics: layered landscape, perspective, depth sorting, lighting, shadows, weather and animated characters. Responsive desktop and touch controls.
- Contextual NPC decisions: farmer prioritizes thirsty/hungry animals, shepherd escorts endangered livestock, breeding robot travels to an eligible cow before starting pregnancy. NPCs expose their current intent.
- Cows, sheep, chickens and a farm dog with species-specific behavior and interactions.
- Fire, frost, rain and growth spells with distinct gameplay effects, mana costs, cooldowns and level requirements.
- Persistent XP and levels earned through care, crops, quests and breeding. No compulsory cow processing. Optional, non-graphic meat delivery route.
- Mature, healthy cows can receive a requested robot insemination visit. Pregnancy progresses in game time, creates one calf, and reserves a herd slot. Existing cows plus pending births never exceed 20.
- Save/continue on the same browser, pause, mute, onboarding, visible goals and informative error states. No account or payment needed to play.

## Completion evidence

1. Deterministic tests for XP thresholds, spell effects and cooldowns, robot prerequisites, pregnancy, cap/reservations, NPC behavior, save/load and optional processing.
2. Successful production build.
3. Browser checks on desktop and narrow touch viewport: actual playing, care, spells, NPC interaction, save/continue; inspect screenshots and errors.
4. Public Cloudflare URL verified by opening the deployed build; repository URL verified, documentation and meaningful screenshots included.

## Current state

Implemented as a separate project from meat-lover-native. Includes the expanded categorized General Store, crops and sale economy, cottages/barns/walls, weapons, settlement-scaled wolves, and optional companion/family stories. Insufficient-funds messages calculate the exact shortfall and show the selected product name.

Production build and 13 simulation tests pass. Cloudflare version `877f3cec-b6f3-44b9-8465-4d1422b56d80` is deployed at https://from-cow-to-beef.meat-lover-bc0.workers.dev/. The updated store was checked live: 75 gold against a 110-gold Barn shows a 35-gold shortfall and the product name. The same flow at 390 × 844 shows a 10-gold shortfall with 100 gold, without horizontal overflow.

Source is public at https://github.com/9khfghvzzw-dotcom/from-cow-to-beef. Desktop and mobile screenshots are in `docs/`. Browser checks also confirmed care awards XP, the robot travels and starts pregnancy, a cottage costs 75 and raises population to six/threat to two, a companion joins the household, and a shared meal raises bond to 25. Local saves restore progress after reload. Full breeding/cap, spells, economy and combat invariants are covered in the deterministic simulation tests.
