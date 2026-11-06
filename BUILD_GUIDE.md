# AfterHours: engineering handoff

## Start here

Read `shared/types.ts` for the persisted case contract. `server/engine.ts` owns the workflow, `server/replan.ts` owns brief invalidation and dispatch rules, and `server/providers.ts` owns provider access. The pixel map is `src/OfficeMap.tsx` and `src/officeWorld.ts`; the interaction shell and case views are `src/App.tsx`.

Run the application and inspect a saved case before changing behavior. Never reset `data/` to make a test pass; it contains user cases. Do not print `.env.local` or store keys in screenshots, model context, fixtures, or Git.

## Data flow, start to finish

1. `POST /api/cases` calls the model to interpret an emergency. A validated brief and required checks are persisted as a draft. Missing fields remain empty. The user reviews the card before dispatch.
2. `POST /api/cases/:id/start` runs bounded specialist work. The scout queries Crustdata's ranked company search, then the model selects up to three exact returned candidates. When indexed search has no usable candidates, public web search is the explicit fallback.
3. The investigator resolves unknown company IDs, retrieves exact-ID company records, looks for a professional contact, searches for relevant work, and extracts up to two portfolio pages per candidate. No outreach occurs.
4. The skeptic assesses each requirement from the saved sources. Citations must use IDs from that candidate's evidence. Unsupported positive claims become unknown. Source content is treated as untrusted data in the model prompts.
5. If no candidate clears required checks, the case becomes `needs_input`. The user must revise the brief or explicitly authorize quote-stage preparation. No model decision can bypass that code path.
6. Operations writes a comparison, handover, and candidate-specific quote requests from the current evidence. The resulting artifacts are versioned. User exceptions remain explicit.
7. `POST /dispatch` persists one inbox item per case version. Export includes current artifacts, email drafts without invented addresses, and structured data.

## Replanning contract

Natural-language changes go through `PATCH /api/cases/:id/brief` with `expectedVersion`. The coordinator interprets the change against the existing brief. Direct edits use the same endpoint with a full `brief` object.

Changes increment the brief version. Tasks whose dependency fields changed become superseded. Other completed tasks remain reusable. Artifacts become superseded, and affected requirement assessments are removed. Raw sources remain in the evidence store.

Every asynchronous phase passes through a gate before accepting results. A phase from an old brief exits without modifying current decisions. Provider results can still enter the shared cache; they do not automatically enter a newer case assessment.

Changing deadline or budget should not re-fetch valid company evidence. Changing product, deliverables, must-haves, geography, or exclusions can reopen discovery and related investigation. Old candidates remain inspectable, and their current suitability must be rechecked.

## Public HTTP interface

| Method / path | Purpose |
| --- | --- |
| GET `/api/health` | Configuration indicators and model name; never credentials |
| GET/POST `/api/cases` | List cases / interpret a new brief |
| GET `/api/cases/:id` | Current case snapshot |
| GET `/api/cases/:id/events` | SSE snapshots with monotonic event IDs |
| PATCH `/api/cases/:id/brief` | Version-checked direct edit or instruction |
| POST `/api/cases/:id/start` | Start or resume work |
| POST `/api/cases/:id/pause` | Prevent downstream task starts |
| POST `/api/cases/:id/messages` | Ask the team or a specialist; conversation cannot execute controls |
| POST `/api/cases/:id/reject` | Exclude a candidate and reopen evaluation |
| POST `/api/cases/:id/decision` | Explicitly resolve the current human handoff |
| POST `/api/cases/:id/dispatch` | Version-checked, idempotent internal delivery |
| GET `/api/cases/:id/export` | Download the current package |

SSE reconnects send the latest full snapshot, so the viewer recovers without replaying every event. Cases saved as running are restored paused after a backend restart, with interrupted tasks queued for retry.

## Provider integration

TokenHarbor uses `https://tokenharbor.ai/v1/chat/completions` with the configured model. Model responses are parsed and validated; a malformed structured response gets one repair attempt. Temporary failures have bounded retries. The backend does not silently change models.

Crustdata uses Streamable HTTP MCP at `https://install.crustdata.com/mcp`. Its execution response wraps the underlying result in `value`; unwrap it before reading `companies`, `profiles`, or `results`. This was verified against real responses. Dynamic model-generated JavaScript is prohibited in the adapter. The fixed script labels the derived query and passes parameters through `inputs`.

Use a shared tool-call rate limiter rather than multiplying the endpoint limit by the number of coworkers. Keep cached responses and evidence separate: cache is an optimization, while evidence is the record used to justify a case decision.

## Frontend contract

The map is decorative spatial navigation over real work, not an independent simulation. Working tasks drive destination changes. Doorways and walls must match collision geometry. Keep sprite rendering pixel-aligned and honor reduced motion.

Selecting a coworker opens their channel. Asu's channel includes the team feed. The supervisor can pause/resume, edit the brief, reject a candidate, and authorize a handoff. Message replies cannot pretend to perform these state changes.

Case workspace tabs expose the shortlist, claim evidence, and current documents. Superseded inbox packages remain labeled by version. Internal delivery must never look like an external email was sent.

## Extend carefully

- Add new requirement fields to brief validation, task dependencies, and replan tests together.
- Add tools only through the backend allowlist after reading their real MCP schemas.
- Keep business facts separate from model inference and unresolved commercial terms.
- Never convert an unknown quote or deadline into a confirmed one for a polished demo.
- Do not introduce outside outreach without changing the event-compliant delivery boundary.
- Verify provider access, unit tests, production build, and the real browser flow after material workflow changes.

## Public website and routing

`src/Website.tsx` serves `/` and `/methodology`. Headquarters is lazy-loaded at `/hq` (`/app` is an alias). Express/Vite SPA fallbacks support direct navigation. Website scrolling is enabled with `data-surface=website`; headquarters retains its fixed-height layout. All public site selectors are scoped to `.marketing-site`.

`/hq?talk=asu&scenario=certificates` or `scenario=launch` prefills an editable, unsent brief and opens Asu. This does not load or clear the stored case; creating a new case still requires submitting the brief. The scenario parameter is then removed from the URL. `/hq?agent=skeptic` opens an existing case with Yes selected.

`shared/agentProfiles.ts` owns both the public coworker character descriptions and the voice instruction used for actual case conversation. Task execution and verification gates are unchanged. Discovery now describes service firms rather than only marketing agencies; the launch-agency live run remains the validated end-to-end example. The certificate scenario has not been run as a complete live case.

`src/marketingData.ts` contains public scenarios, primary-source links, and a disposable illustrative mission. `replanIllustration` calls the same pure `applyReplan` used on the backend. Do not replace that graph with ungrounded performance percentages. Recorded local-run counts on the methodology page are a labeled snapshot, not live telemetry.

## Brief validation and chat progress

Generated briefs are normalized by `server/brief.ts`: missing/null optional fields remain empty, and generated display titles are capped at 100 characters. Business constraints retain strict bounds. Direct edits do not silently truncate titles. `jsonModel` supplies field-level validation feedback to its one repair attempt; unrepaired model output returns a 502 rather than a misleading client-input 400. Input validation returns named field errors. The composer restores unsent text after a failed request.

Tool lifecycle events now pair `tool_started` with `tool_completed` or `tool_failed` using a request ID, role, and cache-reuse flag. Chat’s work log derives its current status and history from persisted tasks/events, scoped to the current brief and selected coworker. Completed/paused cases never display an old request as still running. The existing Activity view retains the full event history. Follow-scroll stops while a user reads older messages.

## Persisted provider observability

`server/crustService.ts` owns bounded MCP retries, cache decisions, and attempt recording. `server/traceSafety.ts` sanitizes credentials and truncates previews before persistence. SQLite `crust_requests` survives restart; interrupted captures are marked accordingly. `/api/crustdata/requests` paginates snapshots, and `/api/crustdata/events` streams updates. `src/CrustdataPane.tsx` displays those actual records.

Workflow orchestration lives in the dependency-injected `createEngine` factory in `server/workflow.ts`. Completed-case revisions invalidate dependent work before restarting. Tests run the actual factory with deterministic providers; live QA cases independently exercised completion, warm-cache reuse, post-completion rejection, decision handoff, and idempotent internal dispatch.
