import { describe, expect, it, vi } from "vitest";
import {
  SEGMENT_COLORS,
  addName,
  buildWheelSegments,
  createRotationForWinner,
  removeName,
  replaceName,
  selectWinnerIndex,
  type NameEntry,
} from "@/lib/name-picker";

describe("name management", () => {
  it("trims and adds a name", () => {
    const result = addName([], "  Tim  ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.names[0]?.label).toBe("Tim");
    }
  });

  it("rejects blank names", () => {
    const result = addName([], "   ");

    expect(result).toEqual({ ok: false, error: "Enter a name before adding it." });
  });

  it("rejects duplicates ignoring case", () => {
    const existing: NameEntry[] = [{ id: "1", label: "Tim" }];

    const result = addName(existing, "tim");

    expect(result).toEqual({ ok: false, error: "That name is already on the wheel." });
  });

  it("removes and replaces names", () => {
    const existing: NameEntry[] = [
      { id: "1", label: "Tim" },
      { id: "2", label: "James" },
    ];

    expect(removeName(existing, "1")).toEqual([{ id: "2", label: "James" }]);

    const replaced = replaceName(existing, "2", "  Alex ");
    expect(replaced.ok).toBe(true);
    if (replaced.ok) {
      expect(replaced.names[1]).toEqual({ id: "2", label: "Alex" });
    }
  });
});

describe("wheel logic", () => {
  it("builds evenly spaced segments", () => {
    const names: NameEntry[] = [
      { id: "1", label: "Tim" },
      { id: "2", label: "Alex" },
      { id: "3", label: "Sam" },
    ];

    const segments = buildWheelSegments(names);

    expect(segments).toHaveLength(3);
    expect(segments[0]).toMatchObject({ startAngle: 0, endAngle: 120 });
    expect(segments[1]).toMatchObject({ startAngle: 120, endAngle: 240 });
  });

  it("returns no segments for an empty name list", () => {
    expect(buildWheelSegments([])).toEqual([]);
  });

  it("covers the full wheel for a single name", () => {
    const segments = buildWheelSegments([{ id: "1", label: "Tim" }]);

    expect(segments).toHaveLength(1);
    expect(segments[0]).toMatchObject({ startAngle: 0, endAngle: 360 });
  });

  it("cycles segment colors when names exceed the palette length", () => {
    const names: NameEntry[] = Array.from({ length: SEGMENT_COLORS.length + 2 }, (_, index) => ({
      id: String(index + 1),
      label: `Name ${index + 1}`,
    }));

    const segments = buildWheelSegments(names);

    expect(segments).toHaveLength(names.length);
    for (const [index, segment] of segments.entries()) {
      expect(segment.color).toBe(SEGMENT_COLORS[index % SEGMENT_COLORS.length]);
    }
  });

  it("chooses a valid winner index", () => {
    const spy = vi.spyOn(Math, "random").mockReturnValueOnce(0.74);
    try {
      expect(selectWinnerIndex(4)).toBe(2);
    } finally {
      spy.mockRestore();
    }
  });

  it("throws if there are fewer than two names", () => {
    expect(() => selectWinnerIndex(1)).toThrow("At least two names are required to spin the wheel.");
  });

  it("always advances the wheel rotation", () => {
    const rotation = createRotationForWinner({
      winnerIndex: 1,
      totalNames: 4,
      currentRotation: 135,
    });

    expect(rotation).toBeGreaterThan(135 + 360 * 5);
  });
});
