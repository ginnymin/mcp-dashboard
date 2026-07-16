import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders success variant with green-tinted classes", () => {
    render(<StatusBadge status="success" />);
    const badge = screen.getByText("success");
    expect(badge).toHaveClass("text-success-text");
    expect(badge).toHaveClass("border-success-border");
  });
  it("renders error variant with red-tinted classes", () => {
    render(<StatusBadge status="error" />);
    const badge = screen.getByText("error");
    expect(badge).toHaveClass("text-error-text");
    expect(badge).toHaveClass("border-error-border");
  });
  it("accepts custom label children", () => {
    render(<StatusBadge status="error">failed</StatusBadge>);
    expect(screen.getByText("failed")).toBeInTheDocument();
  });
});
