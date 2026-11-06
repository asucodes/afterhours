# AfterHours × Crustdata — demo and pitch

## The opening

> Business doesn’t clock out. Meet your night shift. AfterHours is a whole office of AI coworkers that finds the right outside help for a business emergency. They research the options, challenge the claims, adapt when plans change, and prepare a handover you can act on.

The joke is the entry point; the service is emergency provider sourcing and coordination. The buyer is a founder or operations lead who would otherwise pay a sourcing consultant or coordinate the research personally. The prototype’s validated live example is replacement launch-agency sourcing.

## The hook

Show the landing page’s **The key is 4** scenario. “Firefox, probably” is parody. It refers to the October 2026 eMudhra weak-key incident, not a Firefox-generated key. Neither Firefox nor eMudhra is a customer, partner, or endorser.

> Some emergencies sound like a joke. One of the affected eMudhra private keys really was the number four. Our fictional Firefox is asking for backup. AfterHours can research specialist partners and prepare the response handover; it does not repair certificates.

Keep this to one sentence in the finals. Use the launch-agency case for a reliable demonstration of the completed workflow; the certificate scenario has now completed live research and stopped for a decision, but does not have an authorized handover.

## Two-minute running order

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:15 | Landing page / pixel office | “Business doesn’t clock out. AfterHours brings an office of AI coworkers to the problems that can’t wait. Today, it replaces the research and coordination work of an emergency sourcing desk.” |
| 0:15–0:30 | The customer request in a saved real launch-agency case | “Our agency pulled out before launch. Find relevant replacements in India, check them, and prepare the handover. Asu makes the brief; Sheer finds providers; Tan investigates.” |
| 0:30–0:50 | Candidate checks, then an original source | “Yes checks every requirement. A company profile is not a confirmed quote or proof of availability. Those stay unknown. If nobody qualifies, Asu asks us for a decision.” |
| 0:50–1:20 | Update brief → change only the deadline; Mission state / revisions | “The plan knows its dependencies. Changing the deadline reopens the affected checks and documents. It keeps the company research, and old in-flight work cannot overwrite the new brief.” |
| 1:20–1:45 | Documents preview, then internal delivery | “Isit prepares the comparison, quote drafts, and handover. Exceptions and unknowns stay in the package. Delivery is internal and versioned. A repeated dispatch returns the same inbox item.” |
| 1:45–2:00 | Methodology graph or final package | “The characters make work visible. The differentiator is the state behind them: grounded sources, targeted replanning, recoverable tasks, and a handover you can use.” |

**Be explicit about saved state.** Introduce the completed live case as an earlier real run. Do not pretend it is a new run executing instantly. Fresh research can take longer than a two-minute slot; the shared Crustdata limiter spaces uncached requests by about 6.2 seconds, and model calls add latency. If demonstrating a live revision, leave enough time to show the preserved evidence even if document regeneration is still running.

## Judge questions

**What service is replaced?**
The bounded work of an emergency sourcing/operations consultant: interpreting the request, discovering candidates, researching them, preparing a comparison and quote requests, and handing over. Commercial agreement and external execution remain with the user.

**Why a swarm rather than one chat?**
A chat was the simpler approach. Separate roles make the work legible; versioned task dependencies make it reusable. The substantive advantage is targeted invalidation and inspectable state. Five prompts are not evidence of independent verification or proof of superiority over a single model.

**How is Crustdata used?**
Company search and identity resolution, exact-ID enrichment, professional-context search, public web search, and page extraction. Sources are saved with candidate association, original URL, retrieved excerpt, and time. The model works within fixed allowlisted tools. Keys stay server-side.

**What was the hardest case?**
The request asks for a provider available by a deadline and inside a budget. Public profiles establish neither current availability nor a scoped quote. The workflow stops for a human decision instead of inventing a winner. An authorized quote-stage package keeps those gaps explicit.

**What happens when it fails?**
Model responses are validated with bounded repair/retry. Optional enrichment failures retain gaps; critical failures block the task for retry. Restarted running cases restore paused, interrupted tasks queue, and completed work persists. Version gates reject stale task results. Idempotent internal dispatch prevents a duplicate delivery.

**How do you know it works?**
53 automated tests currently pass, including replanning, invalid citations, commercial unknowns, stale versions, idempotency, blocked dispatch, movement, seating depth, and the public graph. An inspected local launch-agency run retained 20 sources through a deadline change, reopened three reviews at that stage, and finished with five documents and one inbox delivery. That is one run, not a benchmark. The public website, routing, failed-send text recovery, and certificate-brief submission are browser-checked separately. The chat work log now shows actual task and tool events.

**What was left out?**
External outreach, booking, payments, continuous monitoring, and wider fault injection. The certificate parody is a new input scenario; its research stage now runs live and stops for an explicit decision when requirements remain unverified.

**What next, and why later?**
Crustdata Watcher events could invalidate checks after a contact or company changes. Deeper enrichment could add relevant hiring, review, or funding context. These require freshness rules, signal validation, and broader testing; they are not appropriate to bolt onto the core just for the demo. The documented Watcher cadence is daily, not instant incident detection.

## Setup before the finals

- Keep the local API and Vite server running; open `/`, `/hq`, and `/methodology`.
- Open a real saved case with visible sources and documents; keep its starting state clear.
- Know the Update brief → deadline change path and the Mission state revision view.
- Have the internal inbox and package export ready. Don’t send real external messages.
- Check the projector, browser zoom, power, and network before the organizer’s 8:45 AM check deadline if attending the finals described in their instructions.
- Record your own backup demo video before the slot. The earlier generated edit was rejected and should not be used as the final demo.

## Primary references

- [YC: How to pitch your company](https://www.ycombinator.com/blog/how-to-pitch-your-company/)
- [YC: A guide to Demo Day presentations](https://www.ycombinator.com/blog/guide-to-demo-day-pitches/)
- [Cloudflare: eMudhra weak-key follow-up](https://blog.cloudflare.com/emudhra-patching/)
- [Mozilla: response to the compromise](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/)
- [Crustdata MCP tools](https://crustdata.com/mcp-server)
- [Crustdata Watcher](https://crustdata.com/apis/watcher)

## Other researched hooks

These are optional fictional customer lines, not claims that the companies used AfterHours:

- **“The cloud has called in sick.”** A startup looking for an independent cloud-recovery consultant and a customer-communications team. Amazon’s account of its October 20, 2025 disruption identifies DynamoDB endpoint DNS resolution issues: [Amazon’s event summary](https://www.aboutamazon.com/news/aws/aws-service-disruptions-outage-update).
- **“Our security update needs a recovery plan.”** A fictional customer sourcing Windows recovery specialists after a bad update. CrowdStrike’s own report confirms the July 19, 2024 Windows sensor content-update outage: [CrowdStrike’s root-cause announcement](https://www.crowdstrike.com/en-us/blog/channel-file-291-rca-available/).

Keep the joke about the situation. The product’s demonstrated job remains partner research and coordination, rather than direct infrastructure remediation.

## Request pane and measured rehearsal

Open **Crustdata** in headquarters to inspect request parameters, sanitized response previews, elapsed time, attempts, and cache reuse. Workspace and mission scopes are separate. This is persisted tool-boundary capture, not an HTTP packet log; authentication handshakes and historical request bodies from before instrumentation are not reconstructed.

A fresh QA bread-vendor case completed with 16 source records and five documents in 174 seconds: nine network attempts and four cache reuses. A second run completed in 161 seconds with zero Crustdata network attempts and 13 cache reuses. Fresh model calls still dominate the warm run. These are two observations, not a latency guarantee; use a clearly identified saved run for the two-minute slot.

Rejecting the sole qualifying provider in the completed QA case correctly reopened version 2 and stopped for a decision. Explicit quote-stage authorization then produced four current documents. Repeated internal dispatch left one inbox item. Automated integration checks also cover deadline changes after completion, interrupted-task recovery, concurrent starts, provider retry/reconnect, and source-quality exclusions.

The six-panel Firefox parody is at `/comic`, with full-size download, a transcript, and an editable unsent demo brief. Team names: Asu (lead), Sheer (scout), Tan (research), Yes (critic), Isit (operations).
