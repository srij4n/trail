# Trail — Implementation Plan

## Product approach
Trail is a citizen-powered accountability workspace with three first-class modes: citizen, official, and auditor. The first release uses the managed MySQL database for durable complaints, append-only events, demo clock state, evidence metadata, audit flags, legal-aid records, and seeded demo accounts. The UI is a single responsive React experience with role-aware views and a public tracker/verification surface. Every mutation that changes case state writes a new event; event rows have no update or delete procedure. The tamper demo is the only intentional direct edit and is auditor-only.

The prototype is optimized for a convincing end-to-end demo: the seeded municipal ward payment-demand case is immediately visible, demo clock actions surface escalation and review transitions, and the event chain is readable rather than hidden behind a generic admin table. Real-world data, names, legal outcomes, and official identities are not used.

## Architecture and implementation

- **Frontend:** React + Wouter + Tailwind, with a calm civic operations visual system. Main routes: `/`, `/file`, `/track/:id`, `/verify`, `/official`, `/auditor`, `/legal`, and `/about`.
- **Backend:** Express + tRPC. Public procedures expose simulated public tracking and record verification. Protected procedures use the starter Manus OAuth session and map the signed-in visitor to a demo role; for the demo, the UI also offers role previews backed by seeded server data without treating them as real identities.
- **Database:** Drizzle MySQL tables for users, complaints, complaint_events, evidence, authority_chains, audit_flags, legal_aid_entries, demo_clock, and seed metadata. Complaint events store `prevHash` and SHA-256 `hash` over the previous hash plus canonical event content. No event update/delete route exists.
- **Evidence:** Upload metadata is persisted with a durable storage key when storage is available; the demo also accepts a local evidence label and demonstrates the file-type path without exposing personal data.
- **AI/transcription:** The server uses the managed LLM helper for a structured report draft when available, and falls back to deterministic seeded transcript/report content. Browser speech input uses `SpeechRecognition` when supported, otherwise the written route remains equivalent.
- **Validation:** `server/hashChain.ts` is pure and covered by Vitest tests for valid, tampered, and appended chains. `pnpm check`, `pnpm test`, and `pnpm build` are the release gates.

## Project structure

- `client/src/App.tsx`: route map, top-level language/simple-mode state.
- `client/src/pages/Home.tsx`: dashboard shell, demo clock, metrics, current case overview.
- `client/src/pages/FileComplaint.tsx`: guided complaint intake, AI draft review, evidence and written route.
- `client/src/pages/TrackComplaint.tsx`: citizen case timeline, deadlines, appeal and export actions.
- `client/src/pages/VerifyRecord.tsx`: public record verification and visible broken-chain state.
- `client/src/pages/OfficialPortal.tsx`: official acknowledgement/progress/reply controls.
- `client/src/pages/AuditorConsole.tsx`: human-review flags, department profile, tamper demo.
- `client/src/pages/LegalHelp.tsx`: escalation options, export checklist, ranked legal-aid directory.
- `client/src/components/*`: navigation, badges, timeline, cards, and UI primitives.
- `server/routers.ts`: role-aware complaint, event, verification, demo-clock, AI-draft, legal-aid, and audit procedures.
- `server/db.ts`: database access and seed initialization.
- `drizzle/schema.ts`: durable relational schema.
- `server/hashChain.ts`: canonical event hashing and chain verification.
- `server/hashChain.test.ts`: hash-chain tests.
- `public/manus-routes.json`: route manifest for the managed preview/publisher.
- `README.md`: architecture, limits, simulated-data warning, and local run instructions.

## Design direction

### Considered styles
- **Civic Ledger / Editorial Utility** — 0.07 probability: paper-white canvas, ink typography, ledger rules, and signal colors for accountability states.
- **Quiet Public Service** — 0.06 probability: muted blue-gray cards, friendly rounded UI, and restrained government portal conventions.
- **High-Contrast Control Room** — 0.05 probability: dark shell, bright telemetry accents, dense operational tables.

### Chosen style: Civic Ledger / Editorial Utility

- **Design Movement:** Civic data journalism meets archival ledger design: legible, accountable, tactile, and built for scrutiny.
- **Core Principles:** Evidence over noise; every state change is visible; serious but not punitive; progressive disclosure for complex workflows.
- **Color Philosophy:** Warm paper and ink create trust and permanence. A distinctive saffron signal marks attention and deadlines, while deep indigo anchors navigation and a cool mint confirms healthy, verified records. Red is reserved for broken chains or overdue states, never for allegations.
- **Layout Paradigm:** A wide editorial workspace with an offset content column, slim left rail, and recurring vertical timeline spine. Avoid centered marketing hero blocks; use dense, intentional asymmetry.
- **Signature Elements:** A “trail line” hash motif running through timelines; small monospaced record IDs; saffron underlines on critical controls.
- **Interaction Philosophy:** Mutations should feel like adding a note to a public record. Buttons say exactly what will happen, and confirmations call out that history cannot be edited away.
- **Animation:** Fast 150–220ms fades and line-draw reveals for timelines. Use motion only to clarify state changes; no looping decorative motion.
- **Typography System:** Use a strong serif display face for page titles and an accessible sans for controls/body, with IBM Plex Mono-style monospace for IDs, hashes, and timestamps. Fall back to Georgia, system-ui, and ui-monospace so the app remains self-contained.
- **Brand Essence:** “A clear trail for every complaint.” For citizens, officials, and auditors who need accountability without hidden state. Personality: grounded, transparent, exact.
- **Brand Voice:** Headlines are direct (“Nothing disappears quietly.”). CTAs are explicit (“File a complaint”, “Verify this record”, “Add a progress note”).
- **Wordmark & Logo:** A compact vertical trail mark made from three offset rules that converge into a square checkpoint, paired with the wordmark “trail” in lowercase.
- **Signature Brand Color:** Saffron `#e6a51a`, used as the ownable signal for attention, evidence, and the demo clock.

## Build and delivery workflow

1. Add schema, seed data, event hashing, procedures, and the public route manifest.
2. Replace starter screen with the Trail shell and role-aware demo interactions.
3. Add automated tests and README documentation.
4. Start the managed dev server, verify `/api/health` and `/manus-routes.json`, run typecheck/tests/build.
5. Commit to the canonical `main` remote for a checkpoint, then publish using the managed deployment configuration. Connect/push to a public GitHub repo only if the session has a GitHub connector and the user’s repository authorization is available; otherwise report that blocker rather than inventing a URL.
