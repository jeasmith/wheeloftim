"use client";

import { useState } from "react";
import { Input } from "@repo/ui/input";
import { Button } from "@repo/ui/button";

export interface ParticipantListProps {
  participants: string[];
  onAdd: (name: string) => void;
  onRemove: (index: number) => void;
}

export function ParticipantList({
  participants,
  onAdd,
  onRemove,
}: ParticipantListProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !participants.includes(trimmed)) {
      onAdd(trimmed);
      setInputValue("");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          placeholder="Enter participant name"
          value={inputValue}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button onClick={handleAdd} disabled={!inputValue.trim()}>
          Add
        </Button>
      </div>
      {participants.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Participants ({participants.length}):</h3>
          <ul className="space-y-1">
            {participants.map((name, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <span>{name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

