import { and, asc, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { auditFlags, complaintEvents, complaints, demoAccounts, demoClock, evidence, legalAidEntries, users, type InsertUser } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { computeEventHash, GENESIS_HASH } from "./hashChain";

let _db: ReturnType<typeof drizzle> | null = null;
let seedAttempted = false;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const values: InsertUser = { openId: user.openId, name: user.name, email: user.email, loginMethod: user.loginMethod, role: user.role ?? (user.openId === ENV.ownerOpenId ? "admin" : "user"), lastSignedIn: user.lastSignedIn ?? new Date() };
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: { name: values.name, email: values.email, loginMethod: values.loginMethod, lastSignedIn: values.lastSignedIn, role: values.role } });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

const DEMO_COMPLAINT_ID = "TRAIL-DEMO-001";
const DEMO_DEPARTMENT = "Municipal Ward Office · Simulated";

const seedLegalAid = [
  { name: "Civic Justice Desk", location: "Delhi / Remote", languages: "English, Hindi", format: "Phone + video", access: "free", verified: 1, category: "Public services" },
  { name: "People's Legal Clinic", location: "Lucknow / Remote", languages: "Hindi, English", format: "In person", access: "free", verified: 1, category: "Public services" },
  { name: "Accountability Counsel Studio", location: "Mumbai / Remote", languages: "English", format: "Video", access: "paid", verified: 1, category: "Administrative law" },
];

export async function appendEvent(input: { complaintId: string; type: string; actor: string; actorRole: string; payload: unknown; timestamp?: Date; visibility?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const latest = await db.select().from(complaintEvents).where(eq(complaintEvents.complaintId, input.complaintId)).orderBy(desc(complaintEvents.sequence)).limit(1);
  const prevHash = latest[0]?.hash ?? GENESIS_HASH;
  const timestamp = input.timestamp ?? new Date();
  const id = `evt_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const eventForHash = { id, complaintId: input.complaintId, type: input.type, actor: input.actor, actorRole: input.actorRole, timestamp, payload: input.payload };
  const hash = computeEventHash(prevHash, eventForHash);
  await db.insert(complaintEvents).values({ id, complaintId: input.complaintId, type: input.type, actor: input.actor, actorRole: input.actorRole, timestamp, payload: JSON.stringify(input.payload), prevHash, hash, visibility: input.visibility ?? "public" });
  return { ...eventForHash, prevHash, hash };
}

export async function seedDemoData() {
  const db = await getDb();
  if (!db || seedAttempted) return;
  seedAttempted = true;
  const existing = await db.select().from(complaints).where(eq(complaints.complaintId, DEMO_COMPLAINT_ID)).limit(1);
  if (existing.length === 0) {
    await db.insert(complaints).values({ complaintId: DEMO_COMPLAINT_ID, category: "Unofficial payment request", departmentId: "ward-office-04", departmentName: DEMO_DEPARTMENT, description: "A simulated ward office requested an unofficial payment before processing a street-light repair request. This demo record contains no real person or office.", status: "filed", currentAuthority: "Municipal Ward Office · Simulated", isDemo: 1 });
    await appendEvent({ complaintId: DEMO_COMPLAINT_ID, type: "filed", actor: "Demo citizen", actorRole: "citizen", payload: { category: "Unofficial payment request", channel: "written complaint", evidence: "receipt-photo-demo.jpg" } });
    await db.insert(evidence).values({ complaintId: DEMO_COMPLAINT_ID, fileName: "receipt-photo-demo.jpg", fileType: "image/jpeg", storageKey: null });
  }
  const clock = await db.select().from(demoClock).where(eq(demoClock.id, 1)).limit(1);
  if (clock.length === 0) await db.insert(demoClock).values({ id: 1, offsetSeconds: 0 });
  const accounts = await db.select().from(demoAccounts).limit(1);
  if (accounts.length === 0) await db.insert(demoAccounts).values([
    { username: "demo.citizen", displayName: "Demo citizen", role: "citizen", passwordHint: "demo access" },
    { username: "demo.official", displayName: "Demo official", role: "official", passwordHint: "demo access" },
    { username: "demo.auditor", displayName: "Demo auditor", role: "auditor", passwordHint: "demo access" },
  ]);
  const legal = await db.select().from(legalAidEntries).limit(1);
  if (legal.length === 0) await db.insert(legalAidEntries).values(seedLegalAid);
  const flags = await db.select().from(auditFlags).limit(1);
  if (flags.length === 0) await db.insert(auditFlags).values([
    { complaintId: DEMO_COMPLAINT_ID, kind: "missing_information", reason: "The exact date of the alleged request is not present in the first written statement.", severity: "review" },
    { complaintId: DEMO_COMPLAINT_ID, kind: "duplicate_detection", reason: "One similar demo record exists in the same simulated department; compare evidence before merging.", severity: "low" },
  ]);
}

export async function getDemoSnapshot() {
  const db = await getDb();
  if (!db) return null;
  await seedDemoData();
  const complaint = (await db.select().from(complaints).where(eq(complaints.complaintId, DEMO_COMPLAINT_ID)).limit(1))[0];
  const events = await db.select().from(complaintEvents).where(eq(complaintEvents.complaintId, DEMO_COMPLAINT_ID)).orderBy(asc(complaintEvents.sequence));
  const evidenceRows = await db.select().from(evidence).where(eq(evidence.complaintId, DEMO_COMPLAINT_ID));
  const flags = await db.select().from(auditFlags).where(eq(auditFlags.complaintId, DEMO_COMPLAINT_ID));
  const legalAid = await db.select().from(legalAidEntries).orderBy(asc(legalAidEntries.access));
  const clock = (await db.select().from(demoClock).where(eq(demoClock.id, 1)).limit(1))[0];
  return { complaint, events, evidence: evidenceRows, flags, legalAid, clock };
}

export async function updateComplaintStatus(complaintId: string, status: string, currentAuthority?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.update(complaints).set({ status, ...(currentAuthority ? { currentAuthority } : {}) }).where(eq(complaints.complaintId, complaintId));
}

export async function getComplaintEvents(complaintId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(complaintEvents).where(eq(complaintEvents.complaintId, complaintId)).orderBy(asc(complaintEvents.sequence));
}

export async function advanceDemoClock(seconds: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await seedDemoData();
  const current = (await db.select().from(demoClock).where(eq(demoClock.id, 1)).limit(1))[0];
  const nextOffset = Math.max(0, (current?.offsetSeconds ?? 0) + seconds);
  await db.update(demoClock).set({ offsetSeconds: nextOffset }).where(eq(demoClock.id, 1));
  const events = await getComplaintEvents(DEMO_COMPLAINT_ID);
  const has = (type: string) => events.some(event => event.type === type);
  if (nextOffset >= 20 && !has("escalated")) {
    await appendEvent({ complaintId: DEMO_COMPLAINT_ID, type: "escalated", actor: "Trail escalation engine", actorRole: "system", payload: { reason: "No acknowledgement or progress note by the simulated deadline", deadlineSeconds: 20 } });
    await updateComplaintStatus(DEMO_COMPLAINT_ID, "escalated", "Municipal Zone Review Cell · Simulated");
  }
  if (nextOffset >= 40 && !has("progress_note")) {
    await appendEvent({ complaintId: DEMO_COMPLAINT_ID, type: "progress_note", actor: "Demo official", actorRole: "official", payload: { note: "The simulated office has been asked for a written response. This note resets the review clock.", clockReset: true } });
    await updateComplaintStatus(DEMO_COMPLAINT_ID, "active_review", "Municipal Zone Review Cell · Simulated");
  }
  if (nextOffset >= 60 && !has("closed")) {
    await appendEvent({ complaintId: DEMO_COMPLAINT_ID, type: "closed", actor: "Demo official", actorRole: "official", payload: { reason: "Demo closure after response review", outcome: "documented response recorded" } });
    await updateComplaintStatus(DEMO_COMPLAINT_ID, "closed", "Municipal Zone Review Cell · Simulated");
  }
  if (nextOffset >= 80 && !has("appealed")) {
    await appendEvent({ complaintId: DEMO_COMPLAINT_ID, type: "appealed", actor: "Demo citizen", actorRole: "citizen", payload: { reason: "Citizen requests oversight review of the closure" } });
    await updateComplaintStatus(DEMO_COMPLAINT_ID, "appealed", "Independent Oversight Desk · Simulated");
  }
  return getDemoSnapshot();
}

export async function tamperDemoRecord() {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await seedDemoData();
  const first = (await db.select().from(complaintEvents).where(eq(complaintEvents.complaintId, DEMO_COMPLAINT_ID)).orderBy(asc(complaintEvents.sequence)).limit(1))[0];
  if (!first) throw new Error("Demo record has no event");
  await db.update(complaintEvents).set({ payload: JSON.stringify({ ...JSON.parse(first.payload), tampered: true }) }).where(eq(complaintEvents.id, first.id));
  return { tamperedEventId: first.id };
}

export { DEMO_COMPLAINT_ID };
