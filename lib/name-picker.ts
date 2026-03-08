export type NameEntry = {
  id: string;
  label: string;
};

export type SpinState = "idle" | "spinning" | "result";

export type WheelSegment = {
  id: string;
  label: string;
  color: string;
  startAngle: number;
  endAngle: number;
  labelAngle: number;
};

type NameResult =
  | { ok: true; names: NameEntry[] }
  | { ok: false; error: string };

const SEGMENT_COLORS = [
  "#f97316",
  "#facc15",
  "#fb7185",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#34d399",
  "#f59e0b",
];

export const STORAGE_KEY = "wheel-of-tim:names";

function normalizeName(label: string) {
  return label.trim();
}

function createNameEntry(label: string): NameEntry {
  return {
    id: crypto.randomUUID(),
    label,
  };
}

export function addName(existingNames: NameEntry[], rawLabel: string): NameResult {
  const label = normalizeName(rawLabel);
  if (!label) {
    return { ok: false, error: "Enter a name before adding it." };
  }

  const normalized = label.toLocaleLowerCase();
  const duplicate = existingNames.some((entry) => entry.label.toLocaleLowerCase() === normalized);
  if (duplicate) {
    return { ok: false, error: "That name is already on the wheel." };
  }

  return { ok: true, names: [...existingNames, createNameEntry(label)] };
}

export function replaceName(existingNames: NameEntry[], id: string, rawLabel: string): NameResult {
  const label = normalizeName(rawLabel);
  if (!label) {
    return { ok: false, error: "Edited names cannot be blank." };
  }

  const normalized = label.toLocaleLowerCase();
  const duplicate = existingNames.some((entry) => entry.id !== id && entry.label.toLocaleLowerCase() === normalized);
  if (duplicate) {
    return { ok: false, error: "That edited name already exists." };
  }

  return {
    ok: true,
    names: existingNames.map((entry) => (entry.id === id ? { ...entry, label } : entry)),
  };
}

export function removeName(existingNames: NameEntry[], id: string) {
  return existingNames.filter((entry) => entry.id !== id);
}

export function clearNames() {
  return [] as NameEntry[];
}

export function selectWinnerIndex(totalNames: number) {
  if (totalNames < 2) {
    throw new Error("At least two names are required to spin the wheel.");
  }

  return Math.floor(Math.random() * totalNames);
}

export function buildWheelSegments(names: NameEntry[]): WheelSegment[] {
  if (!names.length) {
    return [];
  }

  const slice = 360 / names.length;
  return names.map((entry, index) => {
    const startAngle = index * slice;
    const endAngle = startAngle + slice;

    return {
      id: entry.id,
      label: entry.label,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
      startAngle,
      endAngle,
      labelAngle: startAngle + slice / 2,
    };
  });
}

export function createRotationForWinner({
  winnerIndex,
  totalNames,
  currentRotation,
}: {
  winnerIndex: number;
  totalNames: number;
  currentRotation: number;
}) {
  const segmentAngle = 360 / totalNames;
  const targetSegmentCenter = winnerIndex * segmentAngle + segmentAngle / 2;
  const pointerAngle = 0;
  const normalizedCurrentRotation = ((currentRotation % 360) + 360) % 360;
  const targetRotationWithinCircle = pointerAngle - targetSegmentCenter;
  const delta = ((targetRotationWithinCircle - normalizedCurrentRotation) % 360 + 360) % 360;

  return currentRotation + 360 * 6 + delta;
}
