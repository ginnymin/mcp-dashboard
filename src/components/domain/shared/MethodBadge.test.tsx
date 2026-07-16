import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MethodBadge } from "./MethodBadge";

describe("MethodBadge", () => {
  it("renders initialize with blue-tinted classes", () => {
    render(<MethodBadge method="initialize" />);
    const badge = screen.getByText("initialize");
    expect(badge).toHaveClass("text-method-init-text");
    expect(badge).toHaveClass("border-method-init-border");
  });
  it("renders tools/list with violet-tinted classes", () => {
    render(<MethodBadge method="tools/list" />);
    const badge = screen.getByText("tools/list");
    expect(badge).toHaveClass("text-method-list-text");
    expect(badge).toHaveClass("border-method-list-border");
  });
  it("renders tools/call with cyan-tinted classes", () => {
    render(<MethodBadge method="tools/call" />);
    const badge = screen.getByText("tools/call");
    expect(badge).toHaveClass("text-method-call-text");
    expect(badge).toHaveClass("border-method-call-border");
  });
});
