import { describe, expect, it } from "vitest";
import { formatSessionDuration } from "./session-utils";

describe("session-utils", () => {
  it("formats session duration from start and end times", () => {
    expect(
      formatSessionDuration(
        "2026-06-16T14:30:00.000Z",
        "2026-06-16T15:15:00.000Z",
      ),
    ).toBe("45m");
  });

  it("returns a dash when the session has not ended", () => {
    expect(formatSessionDuration("2026-06-17T09:00:00.000Z", null)).toBe("—");
  });
});
