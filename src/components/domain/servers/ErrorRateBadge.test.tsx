import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ErrorRateBadge } from "./ErrorRateBadge";
import { getErrorRateLevel } from "./server-list-utils";

describe("getErrorRateLevel", () => {
  it("classifies rates at 10% or above as high", () => {
    expect(getErrorRateLevel(10)).toBe("high");
    expect(getErrorRateLevel(8.9)).toBe("medium");
  });

  it("classifies rates from 1% to 9.99% as medium", () => {
    expect(getErrorRateLevel(1)).toBe("medium");
    expect(getErrorRateLevel(3.7)).toBe("medium");
    expect(getErrorRateLevel(9.99)).toBe("medium");
  });

  it("classifies rates below 1% as low", () => {
    expect(getErrorRateLevel(0.99)).toBe("low");
    expect(getErrorRateLevel(0.4)).toBe("low");
  });

  it("treats missing values as 0%", () => {
    expect(getErrorRateLevel(null)).toBe("low");
    expect(getErrorRateLevel(undefined)).toBe("low");
  });
});

describe("ErrorRateBadge", () => {
  it("renders a warning pill for rates between 1% and 9%", () => {
    render(<ErrorRateBadge errorRate={1.25} />);

    const badge = screen.getByText("1.25%");
    expect(badge.className).toContain("text-warning-text");
    expect(badge.className).toContain("border-warning-border");
  });

  it("renders a success pill for rates below 1%", () => {
    render(<ErrorRateBadge errorRate={0.8} />);

    const badge = screen.getByText("0.80%");
    expect(badge.className).toContain("text-success-text");
  });

  it("renders an error pill for rates at 10% or above", () => {
    render(<ErrorRateBadge errorRate={10} />);

    const badge = screen.getByText("10.00%");
    expect(badge.className).toContain("text-error-text");
  });

  it("renders 0% for null error rates", () => {
    render(<ErrorRateBadge errorRate={null} />);

    const badge = screen.getByText("0.00%");
    expect(badge.className).toContain("text-success-text");
  });
});
