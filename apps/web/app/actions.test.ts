/**
 * Test file for server actions
 * 
 * This file demonstrates the TDD-ready test structure for server actions.
 */

import { describe, it, expect } from "vitest";
import { selectRandomParticipant } from "./actions";

describe("selectRandomParticipant", () => {
  it("should return null for empty array", async () => {
    const result = await selectRandomParticipant([]);
    expect(result).toBeNull();
  });

  it("should return a participant from the array", async () => {
    const participants = ["Alice", "Bob", "Charlie"];
    const result = await selectRandomParticipant(participants);
    expect(participants).toContain(result);
  });

  it("should return a valid participant", async () => {
    const participants = ["Alice"];
    const result = await selectRandomParticipant(participants);
    expect(result).toBe("Alice");
  });
});

