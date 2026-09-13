# DO·LOON·AI EXPRESS × FlyWire — experimental player v0.4

This adds an opt-in laboratory at `fly-lab/index.html`. It loads the repository's
existing English game into a temporary iframe and connects a measured fly circuit
to keyboard actions. No existing game file is modified.

## Run

From the repository root:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/fly-lab/`. Complete the normal game entry screens,
choose the network, click **Ağı yükle / kayıttan devam**, then **Başlat**.
Use **Duraklat** to release the keys and regain control. Loading a network restores its saved decision policy, resets temporary neural activity
and session statistics, and preserves the current temporary game position. The laboratory saves game progress separately and can reload the last network automatically.

## What runs

- **Bundled subset:** 668 neurons and 18,968 directed connection rows from
  FlyWire FAFB v783, extracted by DesktopFly. This is NOT the full fly brain.
- **Full-neuron option:** downloads the 139,255-neuron, filtered-edge binary
  from FlyBrain, pinned to commit `9191824d17871b7851645782d53d23f213ddb938`.
  It does not contain every measured synapse. The UI reports actual loaded counts.
  Download/parse failure is explicit; it never silently substitutes the subset.
- A fixed, signed, incoming-absolute-weight-normalized rate reservoir runs 12
  updates per decision with leaky tanh dynamics. These dynamics are artificial.
- Artificial input indices encode 8×8 grayscale samples of the player's minimap,
  normalized player coordinates, interior and modal indicators (68 channels).
  These are **structured game observations**, not biological fly vision or
  direct perception of the 3D scene. No hidden puzzle solutions enter the model.
- Up to 128 disjoint downstream samples feed a six-action softmax readout.
  Only this readout learns, using a one-step reward-baseline policy update.
- Actions: forward, left strafe, backward, right strafe, interact, wait/close.
  Movement uses the game's existing keyboard handler and collision engine.
- Novel 5-unit cells yield +1, revisits −0.01, no movement outside a modal another
  −0.02. These are engineered exploration rewards, not inferred fly motivations.
- Compare the real graph with a shuffled-target graph or random actions.
  The shuffled control preserves the destination degree multiset, but is not a
  complete biological null model. No superiority claim has been established.

The agent pauses at the game's cipher and written-reflection dialogs. It cannot
read prose, generate answers, solve the entire ARG, or demonstrate self-awareness.
This milestone is autonomous locomotion/exploration infrastructure, not a trained
end-to-end player. Mini-games, camera turning, language and long-horizon planning
remain future work. Learned weights are saved automatically in this browser. Trajectory export contains
observations/decisions/activity; the separate model export is a resumable policy checkpoint.

## Isolation

The iframe gets isolated in-memory local/session storage before game code executes. Its native game state is seeded from the separate laboratory checkpoint when available.
Existing player saves are not read or overwritten. Remote fetch, WebSocket,
EventSource, XHR, beacon and popup calls are disabled in the lab; same-origin GET
assets and the original game's CDN script/media dependencies remain available.
This is test-session isolation for trusted repository code, not a security sandbox
for arbitrary untrusted code. Network services (including live NPC/chat features)
are intentionally unavailable during this experiment. The game entry/age/consent
screens remain in place for the human operator.

## Data provenance and licensing

Bundled `circuit.json` is unchanged from:
https://github.com/DenisSergeevitch/desktop-fly/blob/master/data/circuit.json
Git blob SHA: `10a7d0726571881e77e93e33bd7a23d900025e49`.
See `DATA_LICENSE.md`: FlyWire-derived data is CC BY-NC 4.0. This experimental use
is non-commercial; do not treat it as licensed for commercial deployment.

Full-neuron source:
https://github.com/snedea/flybrain/blob/9191824d17871b7851645782d53d23f213ddb938/data/connectome.bin.gz
Git blob SHA: `5559a1ea2fdf7e65e476abd87ff542e4d0b00bf8`.
Binary layout documented in that project's `js/sim-worker.js`: two uint32 counts,
12-byte directed edges (pre, post, float weight), then 3-byte neuron metadata.
Our rate simulator is original code; it does not reproduce FlyBrain's LIF model.

Cite Dorkenwald et al., Nature 634, 124–138 (2024),
https://doi.org/10.1038/s41586-024-07558-y and Schlegel et al., Nature 634,
139–152 (2024), https://doi.org/10.1038/s41586-024-07686-5.

## Validation

```sh
node fly-lab/test.mjs
node fly-lab/test-bridge.mjs
```

Passed on the actual bundled circuit: load/counts, seeded determinism, finite
activity, probability normalization, real-edge contribution to downstream
features, shuffled-target degree preservation, and readout updates. Binary
format validation uses a small fixture. Bridge tests cover observations, key
release, pause guards, and storage/network isolation in a Node VM.

**Browser validation now runs in GitHub Actions**, with pinned Playwright 1.62.1
and real Chromium. The first run loaded the actual game renderer, moved the
character through its normal collision loop, verified stop/key release and
separate storage, exported a trajectory, and paused at a real cipher dialog.
The full binary loaded **139,255 neurons and 2,698,236 directed connections**
and produced game actions. Screenshots and structured evidence are attached to:
https://github.com/lunarisbahal/the-mind-experiment/actions/runs/34788187138

The browser test uses a synthetic, disposable game-session fixture. It does not
accept legal terms for the user; actual human entry gates remain in the product.
Run locally after installing Playwright and Chromium:

```sh
npm install --prefix fly-lab --no-save --no-package-lock playwright@1.62.1
npx --prefix fly-lab playwright install chromium
node fly-lab/test-browser.mjs
```

Still unvalidated: mobile performance, long-duration stability, improved
exploration against controls, and whole-game completion. Screenshots are evidence
of software operation, not evidence of biological fidelity or consciousness.


## v0.3 — Human teaching and policy persistence

Enable **Öğretmen modu** and use the six demonstration buttons. Each button captures the current observation, performs that action, then trains the readout with a supervised softmax update. Free keyboard play is not recorded. The existing text-puzzle guard remains in force.

**İyi / Kötü** grades the explicitly displayed last executed autonomous action, once per action, and pauses the agent. Credit is attached to that action's captured reservoir features, not to a later observation. Random-action controls cannot receive teaching or feedback.

The decision weights, reward baseline, and training counters are automatically stored in the parent page's localStorage, separately for each network/control configuration. Loading that network restores a compatible checkpoint. **Modeli indir** exports a portable JSON checkpoint; the file input restores it after validation. Checkpoints validate graph fingerprint, mode, seed, dimensions and finite bounded weights before changing the model. Invalid imports leave the current policy intact. Storage failures are shown in the UI.

This preserves the learned decision policy, not recurrent neural state or the exact random trajectory. The native game state is now also saved separately by v0.4. Clearing browser data deletes local checkpoints; download a backup for another browser/device. Model changes are learning mechanisms, not evidence of improved game performance.


## v0.4 — Live monitor and continuing sessions

The rotatable twin-lobe canvas is a schematic arrangement of up to 128 sampled reservoir outputs. Colors and four traces use actual inference/teaching samples; positions are not anatomical coordinates, lines are not EEG, and the fly illustration is not a MuJoCo body. Its animation represents the active/paused state and selected movement.

The parent page saves the laboratory's native `S` state to `flywire-game-v1` every two seconds while visible and on pause/model updates. The ordinary player save is still isolated. After reopening, the saved state seeds the game's existing Continue flow; its legal/age gates remain intact. Interior sessions resume at the saved outdoor entry, and open dialogs/unsaved text are not reconstructed. The last selected network loads automatically, restores its policy, and starts after game entry when automatic continuation is enabled. No game answers or progress flags are invented.

The previous 5,000-action stop is removed; trajectory export retains the most recent 5,000 actions. The agent still pauses for text puzzles, manual pause, errors, or a hidden tab. A previously running agent may resume when the tab becomes visible with automatic continuation enabled. A closed browser cannot run this client-only experiment. It cannot read/solve the entire game; unattended completion and learning improvement are not claimed.
