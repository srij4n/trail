# Trail

Trail is a citizen-powered accountability platform demo. Its governing idea is simple: a complaint with evidence should never disappear without a trace, and an unresolved case should never be silently buried.

## What is implemented

The app uses the managed MySQL-compatible database through Drizzle. Complaints, evidence metadata, demo accounts, audit flags, the demo clock, legal-aid entries, and complaint events are stored server-side. The UI includes citizen intake, AI-assisted draft review with a deterministic fallback, a public tracker, record verification, an official portal, an auditor console, and legal-help guidance.

The demo scenario is a simulated municipal ward office and a simulated request for an unofficial payment. It is deliberately not a real complaint and contains no real people's names. Every page displays a “Simulated demo data” notice.

## Hash chain

Every state-changing action becomes an append-only event. An event stores its own ID, complaint ID, type, actor, timestamp, payload, the previous event hash, and its SHA-256 hash. The hash is computed over the previous hash and a canonical JSON representation of the event's content. Verification recomputes the chain from the genesis hash and reports the first broken event.

This is **tamper-evident, not tamper-proof**. Someone with direct database access can change stored data, and a sophisticated attacker could rewrite history if they can replace the entire database and any external copies. Trail's point is to make silent edits visible and give every correction a new event rather than overwriting history.

## Demo path

Use the role switcher to enter the simulated citizen, official, or auditor workspace. The dashboard's DEMO CLOCK advances the seeded case: filing starts at zero, missing acknowledgement escalates at 20 seconds, a progress note appears at 40 seconds, closure at 60 seconds, and appeal at 80 seconds. The verify page shows the recomputed chain. The auditor-only tamper control changes one stored event payload so verification visibly fails.

## Development

```bash
pnpm install
pnpm db:migrate
pnpm dev
```

Run checks with `pnpm check`, tests with `pnpm test`, and the production build with `pnpm build`. The managed project supplies the database and platform service environment in Preview and publication.

## Safety boundaries

Trail is illustrative software, not a finding-of-fact engine and not legal advice. Misuse checks only flag records for human review. Public views hide names and personal details, complaint volume is separate from substantiated findings, and the legal-aid directory is simulated. Verify any authority chain, deadline, legal remedy, or provider before real use.
