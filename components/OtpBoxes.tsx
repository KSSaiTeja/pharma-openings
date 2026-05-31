"use client";

import { type ClipboardEvent, type KeyboardEvent, useCallback, useRef } from "react";

export const OTP_DIGIT_COUNT = 4;

type OtpBoxesProps = {
  value: string;
  onChange: (digits: string) => void;
  disabled?: boolean;
  length?: number;
  /** Element id of the visible OTP label (e.g. paragraph or legend). */
  labelledBy?: string;
};

function sanitize(d: string, length: number) {
  return d.replace(/\D/g, "").slice(0, length);
}

export function OtpBoxes({ value, onChange, disabled, length = OTP_DIGIT_COUNT, labelledBy }: OtpBoxesProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = sanitize(value, length);
  const chars = Array.from({ length }, (_, i) => digits[i] ?? "");

  const focusAt = useCallback((index: number) => {
    const i = Math.max(0, Math.min(length - 1, index));
    const el = inputsRef.current[i];
    el?.focus();
    el?.select();
  }, [length]);

  const commit = useCallback(
    (next: string) => {
      onChange(sanitize(next, length));
    },
    [length, onChange],
  );

  const handleChange = useCallback(
    (index: number, raw: string) => {
      if (disabled) return;
      const v = sanitize(raw, length);
      if (v.length === 0) {
        commit(digits.slice(0, index) + digits.slice(index + 1));
        return;
      }
      if (v.length >= length) {
        commit(v);
        requestAnimationFrame(() => focusAt(length - 1));
        return;
      }
      if (v.length === 1) {
        const next = (digits.slice(0, index) + v + digits.slice(index + 1)).slice(0, length);
        commit(next);
        requestAnimationFrame(() => {
          if (index < length - 1) inputsRef.current[index + 1]?.focus();
        });
        return;
      }
      const next = (digits.slice(0, index) + v).slice(0, length);
      commit(next);
      requestAnimationFrame(() => focusAt(Math.min(index + v.length, length - 1)));
    },
    [commit, digits, disabled, focusAt, length],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled) return;
      if (e.key === "Backspace") {
        e.preventDefault();
        if (digits[index]) {
          commit(digits.slice(0, index) + digits.slice(index + 1));
        } else if (index > 0) {
          commit(digits.slice(0, index - 1) + digits.slice(index));
          inputsRef.current[index - 1]?.focus();
        }
        return;
      }
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        inputsRef.current[index - 1]?.focus();
      }
      if (e.key === "ArrowRight" && index < length - 1) {
        e.preventDefault();
        inputsRef.current[index + 1]?.focus();
      }
    },
    [commit, digits, disabled, length],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      if (disabled) return;
      e.preventDefault();
      const text = sanitize(e.clipboardData.getData("text"), length);
      if (!text) return;
      commit(text);
      requestAnimationFrame(() => focusAt(Math.min(text.length, length - 1)));
    },
    [commit, disabled, focusAt, length],
  );

  return (
    <div
      className="po-otp-boxes"
      onPasteCapture={handlePaste}
      {...(labelledBy
        ? { role: "group" as const, "aria-labelledby": labelledBy }
        : {})}
    >
      {chars.map((ch, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${index + 1} of ${length}`}
          disabled={disabled}
          maxLength={length}
          value={ch}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={(e) => e.target.select()}
          className="po-otp-box"
        />
      ))}
    </div>
  );
}
