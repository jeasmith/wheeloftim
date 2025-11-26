"use client";

import { useMachine } from "@xstate/react";
import { nameSpinnerMachine } from "@/machines/nameSpinnerMachine";
import { ParticipantList } from "./participant-list";
import { SpinnerButton } from "./spinner-button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";

export function NameSpinner() {
  const [state, send] = useMachine(nameSpinnerMachine);

  const { participants, selectedName } = state.context;
  const isSpinning = state.matches("spinning");

  const handleAdd = (name: string) => {
    send({ type: "ADD_PARTICIPANT", name });
  };

  const handleRemove = (index: number) => {
    send({ type: "REMOVE_PARTICIPANT", index });
  };

  const handleSpin = () => {
    send({ type: "SPIN" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <ParticipantList
            participants={participants}
            onAdd={handleAdd}
            onRemove={handleRemove}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Selected Participant</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedName ? (
            <div className="text-center p-8 bg-primary/10 rounded-lg">
              <p className="text-2xl font-bold text-primary">{selectedName}</p>
            </div>
          ) : (
            <div className="text-center p-8 text-muted-foreground">
              <p>No participant selected yet</p>
            </div>
          )}
          <SpinnerButton
            onClick={handleSpin}
            disabled={participants.length === 0}
            isLoading={isSpinning}
          />
        </CardContent>
      </Card>
    </div>
  );
}

