# vermilion-vault-heist

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/kriptmwan/vermilion-vault-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/kriptmwan/vermilion-vault-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

A top-down stealth heist game for the [make.fun best heist game bounty](https://make.fun/c/best-heist-game-20261122-0559). You are Vesper, a gentleman thief. Cross five rooms of a crimson art-deco bank — the Marble Lobby, the Gilded Gallery, the Ivory Archive, the Crimson Strongroom, and the Vermilion Heart itself — lift the loot, crack each vault, and slip out the getaway door before the alarm hits the roof.

## How it plays

- **Move** with WASD or the arrow keys. **Shift** sneaks: slower, but a guard's cone fills half as fast.
- **Click** to throw a coin — its clink pulls nearby guards over to look. **2** drops a smoke vial that blinds every cone around you. **3** fires an EMP burst that freezes every camera for 8 seconds.
- **Hold TAB** to study the plan: three named routes to the vault — the Grand Hall (direct, lit, watched), the Shadow Lane (longer, dark floor hides you), and the Service Lane (swings wide of the patrols and the beams).
- Guards run a real state machine: **Patrol → Suspicious → Inspect → Alert → Search → Return**, with raycast vision cones, hearing, and A* pathfinding. Cameras sweep. Lasers blink on a fixed rhythm. Tripwires pulse — cross while the light is dim, or sneak over them.
- The **alarm meter** climbs when a cone, a camera, a laser, or a tripwire catches you, and cools when nobody can see you. At 60% the guards converge; at 90% the getaway door seals. A guard shouts **!** and gives you a warning beat before the catch — a fair caught moment.
- Crack the vault (stand beside it), then reach the green EXIT. Bonuses for a ghost run (never spotted), a quiet run (alarm never past 60%), and beating the room's par time.

## Tech

- Plain static files under `game/` — no build step, no library, no network request.
- Delta-time `requestAnimationFrame` loop, tilemap + A* patrol/chase pathfinding, FOV raycasting for vision cones, guard FSM, event-driven logic separate from rendering, and Web Audio synthesized sound (no audio files).
- Source is split one job per file — `guards.js`, `vision.js`, `cameras.js`, `lasers.js`, `loot.js`, `alarm.js`, `routes.js`, `tools.js`, `audio.js`, `input.js`, `world.js`, `render.js`, `main.js`, `shots.js` — so the structure reads at a glance.

## Run it

```sh
python3 -m http.server 8080 --directory game
```

Then open http://localhost:8080 in desktop Chrome.

## Entry

Built for the make.fun competition `best-heist-game-20261122-0559` ("Make the best heist game"). `main.ts` (Node 22) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the kit's vendored `vendor/makefun-game.ts`.

## License

MIT — see [LICENSE](LICENSE).

---

<sub>Entered on [make.fun](https://make.fun/?ref=emz2619t&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
