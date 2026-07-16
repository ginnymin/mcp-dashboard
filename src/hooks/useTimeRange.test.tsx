import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { TimeRangePicker } from "@/components/domain/shared/TimeRangePicker";
import { TimeRangeProvider, useTimeRange } from "./useTimeRange";
import { computeSinceFromPreset } from "@/lib/url-state";

const SearchParamsProbe = () => {
  const [searchParams] = useSearchParams();

  return <output data-testid="search-params">{searchParams.toString()}</output>;
};

describe("useTimeRange", () => {
  it("defaults to a 24h preset without URL params", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00.000Z"));

    const Probe = () => {
      const { preset, getApiParams } = useTimeRange();

      return (
        <div>
          <span data-testid="preset">{preset}</span>
          <span data-testid="since">{getApiParams().since}</span>
          <span data-testid="until">{getApiParams().until ?? ""}</span>
        </div>
      );
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <TimeRangeProvider>
          <Probe />
        </TimeRangeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("preset")).toHaveTextContent("24h");
    expect(screen.getByTestId("since")).toHaveTextContent(
      computeSinceFromPreset("24h", new Date("2026-06-17T12:00:00.000Z")),
    );
    expect(screen.getByTestId("until")).toHaveTextContent("");

    vi.useRealTimers();
  });

  it("keeps preset selection in context without writing URL params", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-17T12:00:00.000Z"));

    render(
      <MemoryRouter initialEntries={["/logs?status=error"]}>
        <TimeRangeProvider>
          <TimeRangePicker />
          <SearchParamsProbe />
        </TimeRangeProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "1h" }));

    const params = new URLSearchParams(
      screen.getByTestId("search-params").textContent ?? "",
    );

    expect(params.get("status")).toBe("error");
    expect(params.get("since")).toBeNull();
    expect(params.get("until")).toBeNull();

    vi.useRealTimers();
  });

  it("uses custom since/until from the URL when both are present", () => {
    const Probe = () => {
      const { preset, customRange, getApiParams } = useTimeRange();

      return (
        <div>
          <span data-testid="preset">{preset}</span>
          <span data-testid="custom-since">{customRange?.since ?? ""}</span>
          <span data-testid="api-until">{getApiParams().until ?? ""}</span>
        </div>
      );
    };

    render(
      <MemoryRouter
        initialEntries={[
          "/logs?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z",
        ]}
      >
        <TimeRangeProvider>
          <Probe />
        </TimeRangeProvider>
      </MemoryRouter>,
    );

    expect(screen.getByTestId("preset")).toHaveTextContent("custom");
    expect(screen.getByTestId("custom-since")).toHaveTextContent(
      "2026-06-10T00:00:00.000Z",
    );
    expect(screen.getByTestId("api-until")).toHaveTextContent(
      "2026-06-18T00:00:00.000Z",
    );
  });
});
