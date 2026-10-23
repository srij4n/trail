import { describe, expect, it } from "vitest";
import { computeEventHash, GENESIS_HASH, verifyChain } from "./hashChain";

const event = (id: string, prevHash: string, payload: unknown) => {
  const base = { id, complaintId: "TRAIL-TEST", type: "filed", actor: "Tester", actorRole: "citizen", timestamp: "2026-01-01T00:00:00.000Z", payload };
  return { ...base, prevHash, hash: computeEventHash(prevHash, base) };
};

describe("Trail tamper-evident event chain", () => {
  it("accepts a valid chain", () => {
    const first = event("evt_1", GENESIS_HASH, { n: 1 });
    const second = event("evt_2", first.hash, { n: 2 });
    expect(verifyChain([first, second])).toMatchObject({ valid: true, checked: 2 });
  });

  it("locates a tampered event", () => {
    const first = event("evt_1", GENESIS_HASH, { n: 1 });
    const second = event("evt_2", first.hash, { n: 2 });
    second.payload = { n: 999 };
    expect(verifyChain([first, second])).toMatchObject({ valid: false, brokenAt: 2 });
  });

  it("accepts an appended event when its previous hash is correct", () => {
    const first = event("evt_1", GENESIS_HASH, { n: 1 });
    const appended = event("evt_3", first.hash, { n: 3 });
    expect(verifyChain([first, appended])).toMatchObject({ valid: true, checked: 2 });
  });
});
