/**
 * Test file for nameSpinnerMachine
 * 
 * This file demonstrates the TDD-ready test structure for XState machine.
 */

import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { nameSpinnerMachine } from "../nameSpinnerMachine";

describe("nameSpinnerMachine", () => {
  it("should start in idle state with empty participants", () => {
    const actor = createActor(nameSpinnerMachine);
    actor.start();
    
    expect(actor.getSnapshot().value).toBe("idle");
    expect(actor.getSnapshot().context.participants).toEqual([]);
    expect(actor.getSnapshot().context.selectedName).toBeNull();
  });

  it("should add participant when ADD_PARTICIPANT event is sent", () => {
    const actor = createActor(nameSpinnerMachine);
    actor.start();
    
    actor.send({ type: "ADD_PARTICIPANT", name: "Alice" });
    
    expect(actor.getSnapshot().context.participants).toContain("Alice");
  });

  it("should not add duplicate participants", () => {
    const actor = createActor(nameSpinnerMachine);
    actor.start();
    
    actor.send({ type: "ADD_PARTICIPANT", name: "Alice" });
    actor.send({ type: "ADD_PARTICIPANT", name: "Alice" });
    
    const participants = actor.getSnapshot().context.participants;
    expect(participants.filter((p) => p === "Alice").length).toBe(1);
  });

  it("should not add empty or whitespace-only participants", () => {
    const actor = createActor(nameSpinnerMachine);
    actor.start();
    
    actor.send({ type: "ADD_PARTICIPANT", name: "   " });
    actor.send({ type: "ADD_PARTICIPANT", name: "" });
    
    expect(actor.getSnapshot().context.participants).toEqual([]);
  });

  it("should remove participant when REMOVE_PARTICIPANT event is sent", () => {
    const actor = createActor(nameSpinnerMachine);
    actor.start();
    
    actor.send({ type: "ADD_PARTICIPANT", name: "Alice" });
    actor.send({ type: "ADD_PARTICIPANT", name: "Bob" });
    actor.send({ type: "REMOVE_PARTICIPANT", index: 0 });
    
    expect(actor.getSnapshot().context.participants).not.toContain("Alice");
    expect(actor.getSnapshot().context.participants).toContain("Bob");
  });

  it("should clear selectedName when removing the selected participant", async () => {
    const actor = createActor(nameSpinnerMachine);
    actor.start();
    
    actor.send({ type: "ADD_PARTICIPANT", name: "Alice" });
    actor.send({ type: "ADD_PARTICIPANT", name: "Bob" });
    
    // Spin to select a participant
    actor.send({ type: "SPIN" });
    
    // Wait for the spinning to complete
    await new Promise((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === "idle" && state.context.selectedName) {
          subscription.unsubscribe();
          resolve(undefined);
        }
      });
    });
    
    const selectedName = actor.getSnapshot().context.selectedName;
    const indexToRemove = actor.getSnapshot().context.participants.indexOf(selectedName!);
    
    if (indexToRemove >= 0) {
      actor.send({ type: "REMOVE_PARTICIPANT", index: indexToRemove });
      expect(actor.getSnapshot().context.selectedName).toBeNull();
    }
  });

  it("should transition to spinning state when SPIN event is sent with participants", () => {
    const actor = createActor(nameSpinnerMachine);
    actor.start();
    
    actor.send({ type: "ADD_PARTICIPANT", name: "Alice" });
    actor.send({ type: "SPIN" });
    
    expect(actor.getSnapshot().value).toBe("spinning");
  });

  it("should not transition to spinning when no participants exist", () => {
    const actor = createActor(nameSpinnerMachine);
    actor.start();
    
    actor.send({ type: "SPIN" });
    
    expect(actor.getSnapshot().value).toBe("idle");
  });

  it("should reset selection when RESET_SELECTION event is sent", async () => {
    const actor = createActor(nameSpinnerMachine);
    actor.start();
    
    actor.send({ type: "ADD_PARTICIPANT", name: "Alice" });
    
    // Spin to select a participant
    actor.send({ type: "SPIN" });
    
    // Wait for the spinning to complete
    await new Promise((resolve) => {
      const subscription = actor.subscribe((state) => {
        if (state.value === "idle") {
          subscription.unsubscribe();
          resolve(undefined);
        }
      });
    });
    
    // Now reset the selection
    actor.send({ type: "RESET_SELECTION" });
    
    expect(actor.getSnapshot().context.selectedName).toBeNull();
  });
});

