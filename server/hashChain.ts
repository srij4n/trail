import { createHash } from "node:crypto";

export type ChainEvent = {
  id: string;
  complaintId: string;
  type: string;
  actor: string;
  actorRole: string;
  timestamp: Date | string;
  payload: unknown;
  prevHash: string;
  hash: string;
};

export const GENESIS_HASH = "0".repeat(64);

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map(key => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

export function canonicalEventContent(event: Omit<ChainEvent, "hash" | "prevHash">): string {
  return canonicalize({
    id: event.id,
    complaintId: event.complaintId,
    type: event.type,
    actor: event.actor,
    actorRole: event.actorRole,
    timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp,
    payload: event.payload,
  });
}

export function computeEventHash(prevHash: string, event: Omit<ChainEvent, "hash" | "prevHash">): string {
  return createHash("sha256").update(`${prevHash}:${canonicalEventContent(event)}`).digest("hex");
}

export function verifyChain(events: ChainEvent[]) {
  let previous = GENESIS_HASH;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (!event || event.prevHash !== previous) return { valid: false, brokenAt: index + 1, checked: index };
    const expected = computeEventHash(previous, event);
    if (event.hash !== expected) return { valid: false, brokenAt: index + 1, checked: index + 1 };
    previous = event.hash;
  }
  return { valid: true, brokenAt: null, checked: events.length };
}
