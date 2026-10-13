# Scenic Drive

An original, modular TypeScript / Three.js scenic-driving game. This is an early playable implementation, not a reverse-engineered copy of Slow Roads and not a finished AAA game. No proprietary Slow Roads code or assets are included.

## Run locally

Requires Node.js 22 and npm, a modern WebGL2 browser, and hardware acceleration.

```sh
git clone --branch feature/scenic-driving-game https://github.com/shamith201119-ship-it/scenic-drive.git
cd scenic-drive
npm install
npm run dev
```

Open the local URL printed by Vite. Click **Start driving** to begin and unlock audio.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

`lint` currently uses strict TypeScript and unused-code diagnostics; it is not an ESLint style checker. The test suite contains eight road and handling tests. Tests and build have **not been executed by the authoring assistant**. Attempts to commit the GitHub Actions workflow failed, so automated CI is not currently available. Do not treat this branch as verified until the commands above pass.

## Implemented systems

| System | Implementation |
|---|---|
| Roads | Deterministic smooth curves and elevation; shoulders, edge lines, dashed center markings, roadside posts |
| Terrain | Road-integrated height function, vertex-colored hills, alpine snow tint |
| Biomes | Forest, alpine, desert, coastal; selectable route starting points |
| Streaming | Quality-dependent chunk radius, one generated chunk per frame after initial loading, GPU resource disposal |
| Precision | Floating render origin to keep the car and camera near local coordinates |
| Scenery | Seeded instanced conifer shapes, trunks, desert plants, rocks; road exclusion corridor |
| Car | Original rounded procedural body, tinted windows, mirrors, rims, animated wheel steering/spin, body roll/pitch, brake lights, night headlights |
| Handling | Fixed 120 Hz bicycle-style simulation, drag, braking, handbrake, wet traction, off-road resistance |
| Cameras | Smoothed chase, hood, timed orbit; speed-sensitive field of view |
| Graphics | Physical car paint, atmospheric sky, fog, directional shadows, tone mapping; high-quality bloom |
| Weather | Clear, overcast, rain; day, sunset, night presets |
| Audio | Synthesized engine, wind and rain noise; enabled only after user interaction |
| Interface | Start/pause menu, settings, speedometer, trip distance, FPS/chunk/draw-call diagnostics |
| Input | Keyboard, session-only key remapping, pointer-captured touch controls, focus-loss pause |
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
| R | Recover to the road |
| P | Toggle scenic autopilot |
| Escape | Pause/resume |

## Architecture

The source separates world generation, streaming, vehicle simulation/model, rendering, input, cameras, audio, and UI. Simulation coordinates remain independent of rendering coordinates. Terrain and road tests assert deterministic behavior and a road-flattened height field. Vehicle tests cover acceleration, braking, stationary steering, time-step validation, wet handling, and long-run finite values.

## Deployment

Run `npm run build`, then publish the **contents of `dist/`** to a static host. Relative asset paths support subdirectory hosting. No deployment has been performed and no live game URL is claimed. Do not expose the development server to the public internet. Review dependency updates and security advisories before production deployment.

## Known limitations and next work

| Area | Limitation |
|---|---|
| Verification | No observed type-check, test, production-build, or browser-playtest results yet |
| Art | One stylized procedural car; no licensed GLB importer, detailed cockpit, textures, or photorealistic asset pack |
| Physics | Simplified handling, not rigid-body suspension, drivetrain, or tire simulation; no reverse gear |
| Collisions | Forgiving outer corridor boundary only; trees/rocks/posts are decorative and do not collide |
| Road generation | Seeded multi-frequency periodic curve, not a branching road network or nonrepeating spline generator |
| Terrain | Sampled height mesh; steep off-road areas need mesh/collision alignment checks |
| Biome transitions | Discrete chunk palettes; smooth ecological transitions are not implemented |
| Ocean | Simple water plane, not shoreline erosion or simulated waves |
| Night | Lighting presets and headlights; no star field or continuous astronomical day/night cycle |
| Weather | Rain points, fog and grip adjustment; no wet road shader, reflections, snow, or spray |
| Streaming | Bounded visible chunks, but generation is on the main thread; no workers, pooling, or dynamic per-chunk LOD yet |
| Precision | Render-origin shifting reduces local camera precision errors, but terrain vertex buffers retain global coordinates; extreme-distance drives need local chunk vertices |
| Audio | Basic synthesis rather than sampled engine/tire sounds |
| Persistence | Settings and key remapping are session-only |
| Accessibility | Touch and focus support exist; full game accessibility and device testing remain pending |
| External resource | Google Fonts is optional; the interface falls back to system fonts when offline |

Before calling this production-ready, run validation, test every camera/weather/quality combination, drive across chunk and biome boundaries for at least 30 minutes, check frame times and memory, and test real touch devices. There is no claim that this implementation outperforms Slow Roads.
