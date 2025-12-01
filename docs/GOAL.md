# Synth RPG Prompt & Schema Rework

## 1. Why This Exists
- Current single-response prompts blend goofy RPG narration with gear-centric coaching, so users get vague music advice or narratives that feel like patch-note dumps.
- We want narration that nudges vibe and immersion, while the actionable section behaves like an oblique strategy deck tailored to a user's hardware.
- Splitting these concerns should stop the "AI slope" (model spiraling into irrelevant lore or strict instructions) and let the app orchestrate the right tone for each moment.

## 2. Experience Vision
- **Tone**: lighthearted quest-giver who riffs on the jam session, never bogging players down in crunchy RPG math.
- **Outcome**: every session delivers one new or unexpected way to use the user's machines, framed as a playful prompt.
- **Structure**: narrative context primes mood → abstract strategy or challenge → optional grounded gear suggestion the user can act on immediately.

## 3. Guiding Principles
1. **Narrative ≠ instruction**: keep fictional beats in their own channel; instructions stay short, metaphorical, and reference the player's hardware or capability tags.
2. **Support any jam state**: whether a user just started, changed gear, or is stuck, the system must compose a relevant narrative + prompt pairing.
3. **Abstract but actionable**: strategies feel like Brian Eno's oblique cards—suggestive, not prescriptive—yet clearly nudge the user to twist a knob or reframe their loop.
4. **Composable outputs**: schema should let frontends remix or omit sections (e.g., narration only for low-UI surfaces, strategies only for quick tips).

## 4. Current Pain Points
- Session schema blends narrative flavor and instructions, so downstream consumers cannot confidently separate them.
- Prompt templates try to coerce the model into juggling lore, hardware context, and motivational advice at once, increasing hallucinations.
- No metadata exists to help the UI or a second model call understand the desired energy level, difficulty, or type of suggestion.
- Limited evaluation harness makes it hard to verify that responses respect tone constraints when user data is sparse.

## 5. Proposed Solution

### 5.1 Response Schema
Add a structured payload shared across API and front-end layers:
| Field | Type | Description |
| --- | --- | --- |
| `session_context` | object | Canonical recap (gear roster, user goal, recent moves). Stored once, passed to prompts. |
| `narrative_context` | string | The fun RPG beat; never includes imperative instructions. |
| `gear_strategy` | string | Concrete suggestion tied to specific hardware traits (e.g., modulation sources, sequencing quirks). |
| `abstract_prompt` | string | Oblique-style nudge; metaphoric, short, no gear names required. |
| `next_hook` | string | Optional cliffhanger or follow-up question to keep the conversation flowing. |
| `tags` | array | Metadata such as `energy: high`, `mood: mischievous`, `difficulty: low`, `surprise: tonal`. |
| `telemetry` | object | Housekeeping fields: model id, prompt template version, safety flags. |

Validation rules:
- `narrative_context` max ~120 words, third-person or omniscient tone.
- `gear_strategy` must mention at least one declared device or capability.
- `abstract_prompt` limited to 1–2 sentences, imperative voice.
- If user gear info is missing, fall back to capability archetypes (e.g., "polyphonic synth", "sampler") supplied by session state.

### 5.2 Prompt Strategy
1. **Shared envelope**: a concise context block containing session summary, player archetype, mood, and any constraints the user set (time limit, genres to avoid).
2. **Narrative prompt template**: focuses solely on storytelling; explicitly forbids instructions and music theory lectures. Output populates `narrative_context` + `tags`.
3. **Strategy prompt template**: references the same envelope + narrative snippet to keep tone aligned, but the instructions highlight the hardware and oblique strategy goals.
4. **Style guardrails**: documented requirements (sentence count, banned words, voice) baked into the prompt instructions and enforced via schema validation/tests.

### 5.3 Multi-Call Orchestration
- **Default flow**: Call 1 → narrative, Call 2 → strategy/abstract prompt. Combine responses into final payload.
- **Adaptive behavior**: if user marks "stuck" or requests a remix, fire a third prompt variant that reinterprets previous strategy while keeping the narrative hook.
- **Caching**: persist `session_context` and last `tags` so later calls can modulate energy (e.g., escalate from chill to hype) without re-deriving state.
- **Safety**: each call logs template version + moderation output to reduce debugging time when tone drifts.

## 6. Implementation Plan
1. **Schema groundwork**
   - Update shared TypeScript definitions (`packages/types/src/llm.ts`, API models, DB storage) with the new fields and validation helpers.
   - Add migration or transformation logic so existing sessions degrade gracefully (e.g., place legacy `prompt` text into both narrative + strategy until fresh data arrives).
2. **Prompt template refactor**
   - Draft the two (or three) dedicated prompt templates with clear instructions, examples, and rejection criteria.
   - Centralize template assets (possibly under `apps/api/src/llm/prompts/`) for versioning.
3. **Orchestration layer**
   - Introduce a session composer that calls the model(s) sequentially, handles retries, and stitches outputs.
   - Ensure telemetry + tags propagate through websockets or REST responses for UI control.
4. **Front-end updates**
   - Adjust rendering to show narrative and strategy in distinct UI components; allow user to request a remix targeting either section.
   - Surface tags as subtle affordances (e.g., icon for energy level).
5. **QA & rollout**
   - Build a suite of canned session fixtures (gear-rich, gear-poor, high-energy) and snapshot the responses.
   - Run a lightweight user pilot, collect qualitative feedback, and gate GA on "narrative fun" + "instruction helpfulness" scores.

## 7. Validation & Metrics
- **Automated checks**: unit tests verifying schema invariants, prompt regression tests comparing outputs to golden files, lint rules that fail if narrative contains imperative verbs from a curated list.
- **User metrics**: track remix requests per session, time from prompt to recorded jam, thumbs-up/down on narrative vs. strategy separately.
- **Quality reviews**: weekly prompt audit where team samples responses using the rubric (tone, novelty, gear relevance, abstraction).

## 8. Open Questions
1. Should we support an additional call dedicated to "coach commentary" (feedback on recorded jam snippets) later, or fold that into `gear_strategy`?
2. How will we store and surface user feedback so the model can adapt future prompts (e.g., avoiding repeated gear suggestions)?
3. Do we need localization hooks now, or can we postpone until after English MVP proves sticky?

_Next step_: align on this proposal, then break down delivery tickets (schema PR, prompt kit, orchestration service, UI polish, evaluation harness).
