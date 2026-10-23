import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 32 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const complaints = mysqlTable("complaints", {
  id: int("id").autoincrement().primaryKey(),
  complaintId: varchar("complaintId", { length: 32 }).notNull().unique(),
  category: varchar("category", { length: 80 }).notNull(),
  departmentId: varchar("departmentId", { length: 64 }).notNull(),
  departmentName: varchar("departmentName", { length: 160 }).notNull(),
  description: text("description").notNull(),
  status: varchar("status", { length: 64 }).notNull(),
  currentAuthority: varchar("currentAuthority", { length: 160 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  isDemo: int("isDemo").default(0).notNull(),
});

export const complaintEvents = mysqlTable("complaint_events", {
  sequence: int("sequence").autoincrement().primaryKey(),
  id: varchar("id", { length: 40 }).notNull().unique(),
  complaintId: varchar("complaintId", { length: 32 }).notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  actor: varchar("actor", { length: 120 }).notNull(),
  actorRole: varchar("actorRole", { length: 32 }).notNull(),
  timestamp: timestamp("timestamp").notNull(),
  payload: text("payload").notNull(),
  prevHash: varchar("prevHash", { length: 64 }).notNull(),
  hash: varchar("hash", { length: 64 }).notNull(),
  visibility: varchar("visibility", { length: 24 }).default("public").notNull(),
});

export const evidence = mysqlTable("evidence", {
  id: int("id").autoincrement().primaryKey(),
  complaintId: varchar("complaintId", { length: 32 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: varchar("fileType", { length: 80 }).notNull(),
  storageKey: varchar("storageKey", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const demoAccounts = mysqlTable("demo_accounts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  displayName: varchar("displayName", { length: 120 }).notNull(),
  role: varchar("role", { length: 32 }).notNull(),
  passwordHint: varchar("passwordHint", { length: 120 }).notNull(),
});

export const demoClock = mysqlTable("demo_clock", {
  id: int("id").primaryKey(),
  offsetSeconds: int("offsetSeconds").default(0).notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const auditFlags = mysqlTable("audit_flags", {
  id: int("id").autoincrement().primaryKey(),
  complaintId: varchar("complaintId", { length: 32 }).notNull(),
  kind: varchar("kind", { length: 64 }).notNull(),
  reason: text("reason").notNull(),
  severity: varchar("severity", { length: 24 }).notNull(),
  status: varchar("status", { length: 24 }).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const legalAidEntries = mysqlTable("legal_aid_entries", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  location: varchar("location", { length: 120 }).notNull(),
  languages: varchar("languages", { length: 255 }).notNull(),
  format: varchar("format", { length: 80 }).notNull(),
  access: varchar("access", { length: 32 }).notNull(),
  verified: int("verified").default(0).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Complaint = typeof complaints.$inferSelect;
export type ComplaintEvent = typeof complaintEvents.$inferSelect;
export type AuditFlag = typeof auditFlags.$inferSelect;
export type LegalAidEntry = typeof legalAidEntries.$inferSelect;
