# Scenic Drive

An original modular TypeScript / Three.js scenic-driving game. This is an early playable implementation, not a reverse-engineered copy of Slow Roads or a finished production game. No proprietary Slow Roads code or assets are included.

## Run locally

Requires Node.js 22, npm, and a modern WebGL2 browser with hardware acceleration.

```sh
git clone --branch feature/scenic-driving-game https://github.com/shamith201119-ship-it/scenic-drive.git
cd scenic-drive
npm install
npm run dev
```

Open the URL printed by Vite. Click **Start driving** to begin and unlock audio. Do not expose the development server to the public internet.

## Validation status

**Not verified:** the authoring assistant has not executed type checks, lint, unit tests, production builds, or browser playtests. GitHub Actions workflow writes failed repeatedly; no CI workflow or successful CI results are claimed.

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

`lint` currently uses TypeScript strict/unused-code diagnostics, not ESLint. There are now 18 unit-test cases including parameterized quality cases. Added characterization tests cover adjacent terrain seams, bounded resident chunks on all quality presets, large forward/backward jumps, root-origin offsets, cleanup, quality switching, deterministic handling, finite-control clamping, off-road resistance, handbraking, and zero-duration stepping. Tests assert intended/current contracts but remain unexecuted. No gameplay behavior was changed in the regression-test update.

## Implemented foundation

| System | Implementation |
|---|---|
| Roads | Deterministic smooth curves and elevation, shoulders, edge lines, center markings, roadside posts |
| Terrain | Road-integrated height function, vertex-colored hills, alpine snow tint |
| Biomes | Forest, alpine, desert, coastal route starting points |
| Streaming | Quality-dependent radius, incremental generation after initial loading, GPU resource disposal |
| Precision | Floating render origin keeps car and camera near local coordinates |
| Scenery | Seeded instanced trees, trunks, desert plants, rocks; road exclusion corridor |
| Car | Original procedural body, windows, mirrors, rims, steering/spinning wheels, body roll/pitch, brake lights and headlights |
| Handling | Fixed 120 Hz simplified simulation, drag, braking, handbrake, wet traction, off-road resistance |
| Cameras | Chase, hood and timed orbit; speed-sensitive field of view |
| Graphics | Physical car paint, sky, fog, shadows, tone mapping, high-quality bloom |
| Environment | Clear, overcast, rain; day, sunset and night presets |
| Audio | Synthesized engine, wind and rain; user interaction required |
| Interface | Start/pause menu, settings, speedometer, distance and performance diagnostics |
| Input | Keyboard, session-only remapping, touch controls and focus-loss pause |
| Autopilot | Forgiving road-following scenic cruise |

## Controls

| Input | Action |
|---|---|
| W / Up | Accelerate |
| S / Down | Brake |
| A / Left | Steer left |
| D / Right | Steer right |
| Space | Handbrake |
| C | Cycle camera |
| R | Recover to road |
| P | Toggle scenic autopilot |
| Escape | Pause/resume |

## Architecture

Modules separate world generation/streaming, vehicle simulation/model, rendering, input, cameras, audio and UI. Simulation coordinates are independent of rendering offsets. Source lives in `src/`; regression tests live in `tests/`.

## Deployment

After validation passes, build and publish the **contents of `dist/`** to a static host. Relative paths support subdirectory hosting. No deployment has been performed and no live game URL is claimed. Review dependency versions and security advisories before production deployment. Dependencies currently have exact version pins but there is no committed lockfile.

## Remaining work

| Area | Limitation / next step |
|---|---|
| Validation | Run all checks and browser tests before changing behavior or claiming completion |
| Art | One procedural car; no licensed GLB importer, detailed cockpit or photorealistic asset pack |
| Physics | Simplified handling; no rigid-body suspension, drivetrain, tire simulation or reverse |
| Collisions | Outer corridor boundary only; decorative objects do not collide |
| Roads | Periodic seeded curve, not branching networks or nonrepeating splines |
| Terrain | Off-road visual/simulation alignment and smooth biome transitions need work |
| Water | Simple plane, no realistic shoreline or waves |
| Lighting | Presets, not a continuous astronomical cycle; no star field |
| Weather | No wet-road reflections, spray or snow |
| Streaming | Main-thread generation; no workers, pooling or per-chunk LOD |
| Precision | Terrain vertex buffers still retain global coordinates; extreme-distance precision needs local chunk vertices |
| Persistence | Settings/remapping are session-only |
| Audio | Basic synthesis, not sampled vehicle audio |
| Accessibility | Real touch-device and wider accessibility testing pending |
| External resources | Optional Google Fonts; offline system-font fallback |

The next gate is passing validation, followed by profiling and visual upgrades. Before production release, test every camera/weather/quality combination, drive across chunk/biome boundaries for at least 30 minutes, inspect frame times and memory, and test real touch devices. This project is not claimed to outperform Slow Roads.
