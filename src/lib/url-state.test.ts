import { describe, expect, it } from "vitest";
import {
  computeSinceFromPreset,
  logFilterDefaults,
  logFilterSchema,
  parseSearchParams,
  patchSearchParams,
  readCustomRangeFromParams,
  resolveTimeRangeApiParams,
  serializeFilters,
  sessionFilterDefaults,
  sessionFilterSchema,
  stripEmpty,
} from "./url-state";

describe("url-state", () => {
  const now = new Date("2026-06-17T12:00:00.000Z");

  it("computes since from preset using a fixed clock", () => {
    expect(computeSinceFromPreset("1h", now)).toBe("2026-06-17T11:00:00.000Z");
    expect(computeSinceFromPreset("24h", now)).toBe("2026-06-16T12:00:00.000Z");
    expect(computeSinceFromPreset("7d", now)).toBe("2026-06-10T12:00:00.000Z");
  });

  it("reads custom ranges only when both since and until are present", () => {
    expect(
      readCustomRangeFromParams(
        new URLSearchParams({
          since: "2026-06-10T00:00:00.000Z",
          until: "2026-06-18T00:00:00.000Z",
        }),
      ),
    ).toEqual({
      since: "2026-06-10T00:00:00.000Z",
      until: "2026-06-18T00:00:00.000Z",
    });
    expect(
      readCustomRangeFromParams(
        new URLSearchParams({ since: "2026-06-10T00:00:00.000Z" }),
      ),
    ).toBeNull();
  });

  it("resolves API params from preset or custom range", () => {
    expect(resolveTimeRangeApiParams("24h", null, now)).toEqual({
      since: "2026-06-16T12:00:00.000Z",
    });
    expect(
      resolveTimeRangeApiParams("24h", {
        since: "2026-06-10T00:00:00.000Z",
        until: "2026-06-18T00:00:00.000Z",
      }),
    ).toEqual({
      since: "2026-06-10T00:00:00.000Z",
      until: "2026-06-18T00:00:00.000Z",
    });
  });

  it("parses and serializes log filters in a round trip", () => {
    const params = new URLSearchParams({
      serverId: "srv_weather",
      status: "error",
      toolName: "get_forecast",
      limit: "50",
      offset: "10",
    });

    const parsed = parseSearchParams(
      params,
      logFilterSchema,
      logFilterDefaults,
    );

    expect(parsed).toEqual({
      limit: 50,
      offset: 10,
      serverId: "srv_weather",
      status: "error",
      toolName: "get_forecast",
    });

    const serialized = serializeFilters(parsed);

    expect(serialized.get("serverId")).toBe("srv_weather");
    expect(serialized.get("status")).toBe("error");
    expect(serialized.get("deploymentId")).toBeNull();
    expect(serialized.get("limit")).toBe("50");
  });

  it("omits empty values when serializing filters", () => {
    const serialized = serializeFilters({
      serverId: "srv_weather",
      deploymentId: "",
      status: undefined,
      limit: 100,
    });

    expect(Array.from(serialized.keys())).toEqual(["serverId", "limit"]);
  });

  it("falls back to defaults when query params are invalid", () => {
    const params = new URLSearchParams({
      limit: "9999",
      status: "error",
    });

    const parsed = parseSearchParams(
      params,
      logFilterSchema,
      logFilterDefaults,
    );

    expect(parsed).toEqual(logFilterDefaults);
  });

  it("parses session filters with defaults", () => {
    const params = new URLSearchParams({
      clientName: "cursor",
      status: "open",
    });

    const parsed = parseSearchParams(
      params,
      sessionFilterSchema,
      sessionFilterDefaults,
    );

    expect(parsed).toEqual({
      limit: 100,
      offset: 0,
      clientName: "cursor",
      status: "open",
    });
  });

  it("strips empty values from parsed objects", () => {
    expect(stripEmpty({ a: "x", b: "", c: undefined, d: 0 })).toEqual({
      a: "x",
      d: 0,
    });
  });

  it("patches only the provided search params", () => {
    const current = new URLSearchParams({
      serverId: "srv_weather",
      sessionId: "ses_test001",
      since: "2026-06-10T00:00:00.000Z",
      until: "2026-06-18T00:00:00.000Z",
    });

    const patched = patchSearchParams(current, {
      sessionId: undefined,
      offset: 0,
    });

    expect(patched.get("serverId")).toBe("srv_weather");
    expect(patched.get("sessionId")).toBeNull();
    expect(patched.get("offset")).toBe("0");
    expect(patched.get("since")).toBe("2026-06-10T00:00:00.000Z");
  });
});
