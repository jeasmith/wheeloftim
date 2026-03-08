import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NamePicker, SPIN_DURATION_MS } from "@/components/name-picker";

describe("NamePicker", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it("adds names and restores them from localStorage", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<NamePicker />);

    await user.type(screen.getByLabelText("Enter a name"), "Tim");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByLabelText("Enter a name"), "Alex");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("2 names")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("wheel-of-tim:names") ?? "[]")).toHaveLength(2);

    unmount();
    render(<NamePicker />);

    const list = await screen.findByTestId("name-list");
    expect(within(list).getByText("Tim")).toBeInTheDocument();
    expect(within(list).getByText("Alex")).toBeInTheDocument();
  });

  it("shows the winner after a spin completes", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<NamePicker />);
    const input = screen.getByLabelText("Enter a name");
    const form = input.closest("form");
    if (!form) {
      throw new Error("Name form not found");
    }

    fireEvent.change(input, { target: { value: "Tim" } });
    fireEvent.submit(form);
    fireEvent.change(input, { target: { value: "Alex" } });
    fireEvent.submit(form);
    fireEvent.click(screen.getByRole("button", { name: "Spin the wheel" }));

    expect(screen.getByRole("button", { name: "Spinning..." })).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(SPIN_DURATION_MS);
    });

    expect(screen.getByTestId("winner-name")).toHaveTextContent("Tim");
  });

  it("prevents duplicate names and supports editing", async () => {
    const user = userEvent.setup();
    render(<NamePicker />);

    await user.type(screen.getByLabelText("Enter a name"), "Tim");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.clear(screen.getByLabelText("Enter a name"));
    await user.type(screen.getByLabelText("Enter a name"), "tim");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("That name is already on the wheel.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const editInput = screen.getByLabelText("Edit Tim");
    await user.clear(editInput);
    await user.type(editInput, "James");
    await user.click(screen.getByRole("button", { name: "Save" }));

    const list = screen.getByTestId("name-list");
    expect(within(list).getByText("James")).toBeInTheDocument();
  });

  it("clears all names when confirmed", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<NamePicker />);

    await user.type(screen.getByLabelText("Enter a name"), "Tim");
    await user.click(screen.getByRole("button", { name: "Add" }));
    await user.type(screen.getByLabelText("Enter a name"), "Alex");
    await user.click(screen.getByRole("button", { name: "Add" }));

    await user.click(screen.getByRole("button", { name: "Clear all" }));

    expect(screen.getByText("No names yet")).toBeInTheDocument();
  });
});
