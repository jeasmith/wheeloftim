import { setup, assign, fromPromise } from "xstate";
import { selectRandomParticipant } from "@/app/actions";

export interface NameSpinnerContext {
  participants: string[];
  selectedName: string | null;
}

export type NameSpinnerEvent =
  | { type: "ADD_PARTICIPANT"; name: string }
  | { type: "REMOVE_PARTICIPANT"; index: number }
  | { type: "SPIN" }
  | { type: "RESET_SELECTION" };

export const nameSpinnerMachine = setup({
  types: {
    context: {} as NameSpinnerContext,
    events: {} as NameSpinnerEvent,
  },
  actors: {
    selectRandomParticipant: fromPromise<
      string | null,
      { participants: string[] }
    >(async ({ input }) => {
      return await selectRandomParticipant(input.participants);
    }),
  },
}).createMachine({
  id: "nameSpinner",
  initial: "idle",
  context: {
    participants: [],
    selectedName: null,
  },
  states: {
    idle: {
      on: {
        ADD_PARTICIPANT: {
          guard: ({ event, context }) => {
            const trimmed = event.name.trim();
            return trimmed.length > 0 && !context.participants.includes(trimmed);
          },
          actions: assign({
            participants: ({ context, event }) => [
              ...context.participants,
              event.name.trim(),
            ],
          }),
        },
        REMOVE_PARTICIPANT: {
          actions: assign({
            participants: ({ context, event }) =>
              context.participants.filter((_, i) => i !== event.index),
            selectedName: ({ context, event }) => {
              const removedName = context.participants[event.index];
              return context.selectedName === removedName
                ? null
                : context.selectedName;
            },
          }),
        },
        SPIN: {
          guard: ({ context }) => context.participants.length > 0,
          target: "spinning",
        },
        RESET_SELECTION: {
          actions: assign({
            selectedName: null,
          }),
        },
      },
    },
    spinning: {
      invoke: {
        id: "selectRandom",
        src: "selectRandomParticipant",
        input: ({ context }) => ({
          participants: context.participants,
        }),
        onDone: {
          target: "idle",
          actions: assign({
            selectedName: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "idle",
          actions: assign({
            selectedName: null,
          }),
        },
      },
    },
  },
});

