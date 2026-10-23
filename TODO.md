# Trail outcome checklist

## Durable accountability records and demo data

- [ ] Use a real server-side database, not browser storage, with roles for citizen, official, and auditor, and seed demo logins for each.
- [ ] Keep all officials, departments, and offices simulated, show a visible “Simulated demo data” banner, and never use real people’s names.
- [ ] Seed one complete demo scenario in which a citizen files a complaint against a simulated municipal ward office for demanding an unofficial payment, with data for missed acknowledgement, escalation, an official progress note, closure, appeal, and legal-aid suggestions.

## Complaint intake and immutable trail

- [ ] Support category, department, description, photo/audio/video/document evidence, generated complaint ID, and timestamp.
- [ ] Record filing, evidence added, acknowledgement, progress note, transfer, escalation, closure, appeal, and restriction as append-only events with id, complaint_id, type, actor, timestamp, payload, prev_hash, and hash.
- [ ] Hash each event with SHA-256 over the previous hash plus canonical event content, provide no event update/delete route, and represent corrections, withdrawals, and closures as new events with reasons.
- [ ] Provide a public Verify record page that recomputes the chain and shows VALID or BROKEN-AT-EVENT-N.
- [ ] Provide an auditor/admin-only Simulate database tampering control that edits one stored event so verification visibly fails.

## Escalation and role workflows

- [ ] Provide configurable simulated authority chains per department, configurable acknowledgement/review/response deadlines, and a DEMO CLOCK control that advances time in seconds.
- [ ] Escalate only when there is no acknowledgement or progress note by the deadline; show Awaiting acknowledgement, Under active review after an official progress note resets the clock, and Overdue, escalated. Silence must never be treated as proof of misconduct.
- [ ] Show citizens complaint ID, current authority, status, full action history, upcoming deadlines, next steps, and appeal route.
- [ ] Let officials see assigned cases, acknowledge, add progress notes, reply, and dispute without editing or erasing history.

## AI, fairness, privacy, and legal help

- [ ] Generate an AI-assisted structured draft from description and transcript with what happened, when, where, who, and timeline; require citizen review/edit before submit; label it “AI-generated draft. Not a finding of fact.”; use seeded sample transcripts if transcription is unavailable.
- [ ] Provide a written-complaint route without recordings, with a verification step and equal review path.
- [ ] Flag duplicate, missing-information, rate-limit, and coordinated-submission concerns for human review only, showing reasons to an auditor and never deciding guilt.
- [ ] Let citizens appeal rejection or closure through a logged event.
- [ ] Keep names and personal details out of the public tracker; log restrictions with a reason instead of deleting data.
- [ ] Show simulated department accountability profiles with complaint volume separated from substantiated findings; never lower a score because an allegation was filed.
- [ ] When escalation is exhausted, show category-specific oversight/legal options, export a case summary with timeline, complaint references, evidence inventory, and document checklist, and provide simulated legal-aid entries ranked with FREE legal aid first and filters for location, language, and format. Include “general information, not personalised legal advice.”

## Polish and delivery

- [ ] Provide English and Hindi UI, a Simple mode with large text/few steps, and browser speech input where supported.
- [ ] Add automated hash-chain tests for valid, tampered, and appended chains.
- [ ] Write a README covering architecture, hash-chain behavior and limits (tamper-evident, not tamper-proof), and what is simulated.
- [ ] Build and checkpoint the managed project, then publish it and provide the live URL when publication succeeds.
- [ ] Export/connect the project to a public GitHub repo when the GitHub connector and repository authorization are available; report the blocker otherwise.
