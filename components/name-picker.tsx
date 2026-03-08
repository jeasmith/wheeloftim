"use client";

import { FormEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  addName,
  buildWheelSegments,
  clearNames,
  createRotationForWinner,
  removeName,
  replaceName,
  selectWinnerIndex,
  STORAGE_KEY,
  type NameEntry,
  type SpinState,
} from "@/lib/name-picker";

const SPIN_DURATION_MS = 4200;

export function NamePicker() {
  const [names, setNames] = useState<NameEntry[]>([]);
  const [draftName, setDraftName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [spinState, setSpinState] = useState<SpinState>("idle");
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const formId = useId();
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as NameEntry[];
      if (Array.isArray(parsed)) {
        setNames(parsed.filter((entry) => entry && typeof entry.label === "string" && typeof entry.id === "string"));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  }, [isHydrated, names]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const segments = useMemo(() => buildWheelSegments(names), [names]);
  const canSpin = names.length >= 2 && spinState !== "spinning";

  function handleAddName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = addName(names, draftName);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setNames(result.names);
    setDraftName("");
    setErrorMessage("");
    setWinnerName(null);
    if (spinState === "result") {
      setSpinState("idle");
    }
  }

  function handleSpin() {
    if (!canSpin) {
      return;
    }

    const winnerIndex = selectWinnerIndex(names.length);
    const winner = names[winnerIndex];
    const nextRotation = createRotationForWinner({
      winnerIndex,
      totalNames: names.length,
      currentRotation: rotation,
    });

    setSpinState("spinning");
    setWinnerName(null);
    setErrorMessage("");
    setRotation(nextRotation);

    timeoutRef.current = window.setTimeout(() => {
      setWinnerName(winner.label);
      setSpinState("result");
    }, SPIN_DURATION_MS);
  }

  function handleRemove(id: string) {
    setNames((currentNames) => removeName(currentNames, id));
    if (editingId === id) {
      setEditingId(null);
      setEditingValue("");
    }
    setWinnerName(null);
    if (spinState === "result") {
      setSpinState("idle");
    }
  }

  function handleClearAll() {
    if (!window.confirm("Clear all names from the wheel?")) {
      return;
    }

    setNames(clearNames());
    setWinnerName(null);
    setErrorMessage("");
    setSpinState("idle");
    setEditingId(null);
    setEditingValue("");
    setRotation(0);
  }

  function startEdit(entry: NameEntry) {
    setEditingId(entry.id);
    setEditingValue(entry.label);
    setErrorMessage("");
  }

  function saveEdit(id: string) {
    const result = replaceName(names, id, editingValue);
    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setNames(result.names);
    setEditingId(null);
    setEditingValue("");
    setErrorMessage("");
  }

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <p className="eyebrow">Random picker</p>
        <h1>Spin the wheel. Pick a name.</h1>
        <p className="intro">Add names, spin the wheel, and let chance choose the winner.</p>
      </section>

      <section className="app-grid" aria-labelledby={formId}>
        <div className="panel panel-wheel">
          <div className="wheel-frame">
            <div className="pointer" aria-hidden="true" />
            <div
              className={`wheel ${spinState === "spinning" ? "wheel-spinning" : ""}`}
              style={{
                transform: `rotate(${rotation}deg)`,
                background: segments.length
                  ? `conic-gradient(${segments
                      .map((segment) => `${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`)
                      .join(", ")})`
                  : undefined,
              }}
              role="img"
              aria-label="Name wheel"
            >
              {segments.length ? (
                segments.map((segment) => (
                  <div
                    key={segment.id}
                    className="wheel-label"
                    style={{ transform: `rotate(${segment.labelAngle}deg) translateY(-42%)` }}
                  >
                    <span style={{ transform: `rotate(${90}deg)` }}>{segment.label}</span>
                  </div>
                ))
              ) : (
                <div className="wheel-empty">Add at least two names to spin.</div>
              )}
            </div>
          </div>

          <div className="wheel-actions">
            <button type="button" className="primary-button" onClick={handleSpin} disabled={!canSpin}>
              {spinState === "spinning" ? "Spinning..." : "Spin the wheel"}
            </button>
            <p className="helper-text">
              {names.length === 0 && "No names added yet."}
              {names.length === 1 && "Add one more name to unlock spinning."}
              {names.length >= 2 && spinState !== "spinning" && "Ready to pick a random winner."}
              {spinState === "spinning" && "Inputs are locked until the spin finishes."}
            </p>
          </div>

          <div className="result-card" aria-live="polite">
            <p className="result-label">Selected name</p>
            <strong data-testid="winner-name">{winnerName ?? "Nobody picked yet"}</strong>
          </div>
        </div>

        <div className="panel panel-form">
          <div className="panel-header">
            <div>
              <p className="eyebrow" id={formId}>
                Name list
              </p>
              <h2>Manage entries</h2>
            </div>
            <button type="button" className="ghost-button" onClick={handleClearAll} disabled={!names.length || spinState === "spinning"}>
              Clear all
            </button>
          </div>

          <form className="name-form" onSubmit={handleAddName}>
            <label htmlFor="name-input">Enter a name</label>
            <div className="name-form-row">
              <input
                id="name-input"
                name="name"
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="e.g. Tim"
                disabled={spinState === "spinning"}
              />
              <button type="submit" className="primary-button" disabled={spinState === "spinning"}>
                Add
              </button>
            </div>
            {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          </form>

          <div className="list-meta">
            <span>{names.length} names</span>
            <span>{isHydrated ? "Saved automatically" : "Loading names..."}</span>
          </div>

          {names.length ? (
            <ul className="name-list" data-testid="name-list">
              {names.map((entry) => {
                const isEditing = editingId === entry.id;

                return (
                  <li key={entry.id} className="name-item">
                    {isEditing ? (
                      <>
                        <input
                          aria-label={`Edit ${entry.label}`}
                          type="text"
                          value={editingValue}
                          onChange={(event) => setEditingValue(event.target.value)}
                          disabled={spinState === "spinning"}
                        />
                        <div className="item-actions">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => saveEdit(entry.id)}
                            disabled={spinState === "spinning"}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => {
                              setEditingId(null);
                              setEditingValue("");
                            }}
                            disabled={spinState === "spinning"}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span>{entry.label}</span>
                        <div className="item-actions">
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => startEdit(entry)}
                            disabled={spinState === "spinning"}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="text-button"
                            onClick={() => handleRemove(entry.id)}
                            disabled={spinState === "spinning"}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state">
              <strong>No names yet</strong>
              <p>Build the wheel by adding at least two names.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
