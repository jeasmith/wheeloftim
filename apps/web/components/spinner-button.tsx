"use client";

import { Button } from "@repo/ui/button";

export interface SpinnerButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SpinnerButton({
  onClick,
  disabled = false,
  isLoading = false,
}: SpinnerButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      size="lg"
      className="w-full"
    >
      {isLoading ? "Spinning..." : "Spin the Wheel!"}
    </Button>
  );
}

