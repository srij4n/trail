import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { asc, eq } from "drizzle-orm";
import { COOKIE_NAME } from "@shared/const";
import { complaintEvents } from "../drizzle/schema";
import { publicProcedure, router } from "./_core/trpc";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { appendEvent, advanceDemoClock, DEMO_COMPLAINT_ID, getComplaintEvents, getDb, getDemoSnapshot, seedDemoData, tamperDemoRecord, updateComplaintStatus } from "./db";
import { verifyChain } from "./hashChain";

const roleSchema = z.enum(["citizen", "official", "auditor"]);
const demoCookie = "trail_demo_role";

function readDemoRole(req: { headers: { cookie?: string } }) {
  const raw = req.headers.cookie ?? "";
  const value = raw.split(";").map(part => part.trim()).find(part => part.startsWith(`${demoCookie}=`))?.slice(demoCookie.length + 1);
  return value === "citizen" || value === "official" || value === "auditor" ? value : null;
}

function requireRole(ctx: { req: { headers: { cookie?: string } } }, expected: "citizen" | "official" | "auditor") {
  if (readDemoRole(ctx.req) !== expected) throw new TRPCError({ code: "FORBIDDEN", message: `Demo ${expected} login required.` });
}

function friendlyStatus(status: string) {
  return ({ filed: "Awaiting acknowledgement", escalated: "Overdue, escalated", active_review: "Under active review", closed: "Closed with response", appealed: "Appeal logged" } as Record<string, string>)[status] ?? status;
}

export const appRouter = router({
  system: router({ health: publicProcedure.query(() => ({ ok: true })) }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(COOKIE_NAME, { ...getSessionCookieOptions(ctx.req), maxAge: -1 }); return { success: true } as const; }),
    demoSession: publicProcedure.query(({ ctx }) => ({ role: readDemoRole(ctx.req) })),
    demoLogin: publicProcedure.input(z.object({ role: roleSchema })).mutation(({ ctx, input }) => {
      ctx.res.cookie(demoCookie, input.role, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 60 * 60 * 8 });
      return { role: input.role };
    }),
    demoLogout: publicProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(demoCookie, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: -1 });
      return { success: true };
    }),
  }),
  trail: router({
    snapshot: publicProcedure.query(async () => {
      await seedDemoData();
      const data = await getDemoSnapshot();
      if (!data) return { mode: "preview", complaint: null, events: [], evidence: [], flags: [], legalAid: [], clock: { offsetSeconds: 0 } };
      return { ...data, complaint: data.complaint ? { ...data.complaint, friendlyStatus: friendlyStatus(data.complaint.status) } : null };
    }),
    verify: publicProcedure.input(z.object({ complaintId: z.string().default(DEMO_COMPLAINT_ID) })).query(async ({ input }) => {
      const data = await getDemoSnapshot();
      if (!data || !data.complaint || input.complaintId !== DEMO_COMPLAINT_ID) return { valid: false, brokenAt: 1, checked: 0, complaintId: input.complaintId };
      const result = verifyChain(data.events.map(event => ({ ...event, payload: JSON.parse(event.payload) })));
      return { ...result, complaintId: input.complaintId, eventCount: data.events.length };
    }),
    advanceClock: publicProcedure.input(z.object({ seconds: z.number().min(0).max(3600) })).mutation(async ({ input }) => {
      const data = await advanceDemoClock(input.seconds);
      return { ...data, complaint: data?.complaint ? { ...data.complaint, friendlyStatus: friendlyStatus(data.complaint.status) } : null };
    }),
    resetClock: publicProcedure.mutation(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not available." });
      await seedDemoData();
      const { demoClock } = await import("../drizzle/schema");
      await db.update(demoClock).set({ offsetSeconds: 0 }).where(eq(demoClock.id, 1));
      return getDemoSnapshot();
    }),
    fileComplaint: publicProcedure.input(z.object({ category: z.string().min(2), department: z.string().min(2), description: z.string().min(20), evidenceName: z.string().optional(), evidenceType: z.string().optional(), evidenceData: z.string().max(8_000_000).optional() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Database is not available. The managed database is required to file a record." });
      const complaintId = `TRAIL-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { complaints, evidence } = await import("../drizzle/schema");
      await db.insert(complaints).values({ complaintId, category: input.category, departmentId: input.department.toLowerCase().replace(/\s+/g, "-"), departmentName: `${input.department} · Simulated`, description: input.description, status: "filed", currentAuthority: `${input.department} · Simulated`, isDemo: 0 });
      await appendEvent({ complaintId, type: "filed", actor: "Signed-in citizen", actorRole: "citizen", payload: { category: input.category, channel: input.evidenceName ? "evidence upload" : "written complaint" } });
      if (input.evidenceName) {
        let storageKey: string | null = null;
        if (input.evidenceData) {
          try {
            const base64 = input.evidenceData.includes(",") ? input.evidenceData.split(",")[1] : input.evidenceData;
            const stored = await storagePut(`trail/${complaintId}/${input.evidenceName}`, Buffer.from(base64 ?? "", "base64"), input.evidenceType ?? "application/octet-stream");
            storageKey = stored.key;
          } catch (error) { console.warn("[Trail] Evidence storage unavailable; metadata retained:", error instanceof Error ? error.message : error); }
        }
        await db.insert(evidence).values({ complaintId, fileName: input.evidenceName, fileType: input.evidenceType ?? "application/octet-stream", storageKey });
        await appendEvent({ complaintId, type: "evidence_added", actor: "Signed-in citizen", actorRole: "citizen", payload: { fileName: input.evidenceName, fileType: input.evidenceType ?? "unknown", stored: Boolean(storageKey) } });
      }
      return { complaintId };
    }),
    generateDraft: publicProcedure.input(z.object({ description: z.string().min(10), transcript: z.string().optional() })).mutation(async ({ input }) => {
      const fallback = { whatHappened: "A public-service request was delayed after an unofficial payment was requested.", when: "Add the date or approximate time after reviewing this draft.", where: "Add the office, ward, or service location.", who: "Add the role of the person involved; avoid naming private individuals.", timeline: ["Request made", "Payment concern recorded", "Written complaint prepared"] };
      try {
        const response = await invokeLLM({ messages: [{ role: "system", content: "Create a neutral structured complaint draft. Do not decide guilt. Return JSON with whatHappened, when, where, who, and timeline (array of strings)." }, { role: "user", content: `${input.description}\nTranscript: ${input.transcript ?? "No transcript available; use the written description."}` }], responseFormat: { type: "json_object" }, maxTokens: 500 });
        const content = response.choices?.[0]?.message?.content;
        if (typeof content === "string") return { draft: JSON.parse(content), fallback: false };
      } catch (error) { console.warn("[Trail] AI draft fallback:", error instanceof Error ? error.message : error); }
      return { draft: fallback, fallback: true };
    }),
    appeal: publicProcedure.input(z.object({ complaintId: z.string(), reason: z.string().min(10) })).mutation(async ({ input, ctx }) => {
      requireRole(ctx, "citizen");
      await appendEvent({ complaintId: input.complaintId, type: "appealed", actor: "Demo citizen", actorRole: "citizen", payload: { reason: input.reason } });
      await updateComplaintStatus(input.complaintId, "appealed", "Independent Oversight Desk · Simulated");
      return { success: true };
    }),
    acknowledge: publicProcedure.input(z.object({ complaintId: z.string() })).mutation(async ({ input, ctx }) => {
      requireRole(ctx, "official");
      await appendEvent({ complaintId: input.complaintId, type: "acknowledged", actor: "Demo official", actorRole: "official", payload: { note: "Receipt acknowledged by the assigned simulated authority." } });
      await updateComplaintStatus(input.complaintId, "active_review");
      return { success: true };
    }),
    progressNote: publicProcedure.input(z.object({ complaintId: z.string(), note: z.string().min(10) })).mutation(async ({ input, ctx }) => {
      requireRole(ctx, "official");
      await appendEvent({ complaintId: input.complaintId, type: "progress_note", actor: "Demo official", actorRole: "official", payload: { note: input.note, clockReset: true } });
      await updateComplaintStatus(input.complaintId, "active_review");
      return { success: true };
    }),
    reply: publicProcedure.input(z.object({ complaintId: z.string(), note: z.string().min(10) })).mutation(async ({ input, ctx }) => {
      requireRole(ctx, "official");
      await appendEvent({ complaintId: input.complaintId, type: "reply", actor: "Demo official", actorRole: "official", payload: { note: input.note } });
      return { success: true };
    }),
    tamper: publicProcedure.mutation(async ({ ctx }) => {
      requireRole(ctx, "auditor");
      return tamperDemoRecord();
    }),
    audit: publicProcedure.query(async ({ ctx }) => {
      requireRole(ctx, "auditor");
      const data = await getDemoSnapshot();
      return { flags: data?.flags ?? [], department: { name: "Municipal Ward Office · Simulated", received: 18, open: 5, responseHours: 36, resolutionDays: 4.2, substantiated: 2 } };
    }),
  }),
});

export type AppRouter = typeof appRouter;
