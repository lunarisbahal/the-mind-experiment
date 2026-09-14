# DO·LOON·AI EXPRESS × FlyWire — hybrid experiment v0.5

Open `/fly-lab/`, complete the game's normal entry, load a network, and Start.
For a local checkout: `python -m http.server 8000` from the repository root.

## Components and attribution

The fixed rate reservoir uses measured FlyWire connectivity: a bundled 668-neuron,
18,968-edge DesktopFly circuit, or a pinned FlyBrain full-neuron dataset with
139,255 neurons and 2,698,236 filtered edges. The full source is
https://raw.githubusercontent.com/snedea/flybrain/9191824d17871b7851645782d53d23f213ddb938/data/connectome.bin.gz
and does not include every measured synapse. Data terms are in DATA_LICENSE.md.

The artificial dynamics perform 12 leaky tanh updates, using normalized signed
weights, up to 4,096 artificial input neurons and 128 disjoint readout neurons.
Input is the grayscale 8×8 minimap, coordinates and modal/interior indicators.
A six-action softmax readout learns exploration rewards and movement demonstrations.
The connectome does not read language, write text, or become conscious.

A SEPARATE language model reads visible dialog text and buttons, selects a button,
or fills a visible text field then submits it through the game's native controls.
Narration uses its native E control. The model sees no hidden puzzle answers.
It also suggests bounded movement sequences when the agent is stuck. Those
sequences teach the movement readout. Action history labels FlyWire, language
model and human demonstrations separately. Language examples and notes form a
persistent retrieval memory; language model weights are not trained here.

## Stability and teaching

Start expresses ongoing intent. Ordinary dialogs, short game transitions and AI
requests put the agent into a waiting state, not a manual-stop state. Failed AI
requests are shown and retried after 15 seconds. Explicit Pause cancels pending
planner work and discards stale worker decisions. Hidden tabs release movement
keys and resume when visible. Closing the browser still stops execution.

Teacher mode takes control and shows movement buttons plus the current dialog's
actual choices and optional answer field. Turning teacher mode off resumes a
previously running agent. A teacher example must be an actual executed action.
The default delay between decisions is 1.5 seconds and can be adjusted.

The most recent ten actions have immutable IDs and individual Good/Bad controls.
The list freezes on hover/focus or with its checkbox; release the checkbox to
see newer actions. Feedback updates the captured action's feature vector, not
the newest observation, and does not stop the agent. Language feedback is saved
as a labeled example for future decisions. Repeated grading is rejected.

## Persistence and limits

Policy weights, graph signature, baseline and learning counters save automatically
to a separate parent-page storage key. Compatible policies restore after loading
the same network. Model export/import is separate from trajectory export.
Native game state also saves separately from the ordinary player's save; interior
sessions resume at the outdoor entry. Open dialogs and unsaved text are not
reconstructed. The last network automatically loads, and the agent starts after
normal game entry if automatic continuation is enabled. Language notes/examples
persist too. Browser data deletion removes these local records; download backups.

All game storage remains isolated in the iframe. Social/multiplayer/API traffic
is blocked except the two published AI relay POST routes. The lab and its game
Mirror use one shared relay client with timeouts, failover, explicit errors and
the existing 80-response/day shared-line allowance. This allowance is persistent
across reloads. AI requests send visible game text and relevant notes to the
selected provider. The site's original protections, consent and native game
costs are not removed.

When the shared service is unavailable, an explicitly entered Groq key selects
that user's own account at the documented Groq Chat Completions endpoint.
The key stays in this tab's sessionStorage and never enters checkpoints or logs.
That account's quotas and charges apply. Clear the field to use the shared line.
The common relay's server-side secret and Cloudflare account cannot be configured
through the static game repository.

## Live monitor

The rotatable twin-lobe brain and fly are SCHEMATIC. Colors and four traces use
actual sampled rate-model activity. Positions are not anatomical coordinates,
traces are not biological EEG, and the fly is not a MuJoCo body.

## Validation

`node fly-lab/test.mjs` tests measured graph dynamics, teaching, feedback and
checkpoint validation. `node fly-lab/test-bridge.mjs` tests key handling, text
guards and storage/network isolation. `node fly-lab/test-dialogue.mjs` tests
request parsing, quota preservation, explicit failures and stable feedback IDs.

The GitHub Actions browser workflow exercises real 3D movement, native game
narration and rite submission, history feedback, teacher-mode resume and
persistence. Behavioral language decisions use an explicit deterministic transport
fixture; a separate live relay probe reports the actual upstream result without
claiming the fixture proves an available language service. Neither passing tests
nor a higher action count proves that the complete game can be solved or that the
agent improves against baselines. Control modes are available for comparisons.

Startup repair v0.5.1: Start loads the selected network and invokes the native game entry. Entry acknowledgements previously recorded by the user are retained in the isolated game checkpoint; no acknowledgement is manufactured. WebGL failure is reported before stepping. Browser coverage now exercises actual Game.start and a browser with WebGL disabled, rather than forcing Game.running for startup.

### Online residents (v0.5.2)

The laboratory now allows GET `/subject` and `/graduates`, and POST `/subjectsay` and `/graduatesay` on the native Konsey service. Resident replies have a 25-second timeout, an in-flight guard and explicit connection status. The subject task cannot advance on an invented fallback response. The separate LLM reads visible UI, fills native fields, and submits native buttons; FlyWire remains a fixed movement reservoir. Human P2P presence is a separate indicator and remains isolated. Language assistance is enabled once for older saved configurations; later user choices are preserved. Auto-resume also opens native entry instead of waiting indefinitely for an already running game.

The visible dialogue journal stores the last 40 entries locally: observed text, an explicitly requested short LLM summary, submitted text, genuine server reply, and failures. It does not expose or claim private reasoning. HTTP 429 honors Retry-After (otherwise 60s, increasing to 15 minutes) and preserves a shared-line cooldown across reloads; it does not switch endpoints to evade a rate limit. Expected human P2P startup is skipped in this laboratory, while resident AI services have their own truthful status. Actual JavaScript failures remain visible. WebGL requires browser/device support; no website change can guarantee it on unsupported renderers.
