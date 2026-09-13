# DO·LOON·AI EXPRESS × FlyWire — experimental player v0.1

This adds an opt-in laboratory at `fly-lab/index.html`. It loads the repository's
existing English game into a temporary iframe and connects a measured fly circuit
to keyboard actions. No existing game file is modified.

## Run

From the repository root:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/fly-lab/`. Complete the normal game entry screens,
choose the network, click **Ağı yükle / yeni deney**, then **Başlat**.
Use **Duraklat** to release the keys and regain control. A new experiment resets
the network/readout/seed and statistics, but preserves the current temporary game
position. Reload the page to restart the temporary game as well.

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
remain future work. Learned weights are session-local; exported JSON contains
observations/decisions/activity, not a resumable model checkpoint.

## Isolation

The iframe gets fresh in-memory local/session storage before game code executes.
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

**Not yet validated:** full binary download in a browser; end-to-end rendered
3D gameplay; mobile performance; improved exploration against controls.
The development environment's Cloud Browser rejected localhost access and its
local Playwright installation had no browser executable. These are test
limitations, not evidence of successful gameplay. Keep this PR in draft until
browser smoke testing is completed.
