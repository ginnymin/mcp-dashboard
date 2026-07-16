import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { JsonViewer } from "./JsonViewer";

describe("JsonViewer", () => {
  it("renders formatted JSON from the value prop", () => {
    render(
      <JsonViewer
        title="Request"
        value={{ jsonrpc: "2.0", method: "tools/call" }}
      />,
    );

    expect(screen.getByText(/"method": "tools\/call"/)).toBeInTheDocument();
  });

  it("shows a copy button and empty state when value is null", () => {
    render(<JsonViewer title="Request" value={null} />);

    expect(
      screen.getByRole("button", { name: "Copy Request JSON" }),
    ).toBeDisabled();
    expect(screen.getByText("No body")).toBeInTheDocument();
  });

  it("collapses and expands the JSON panel", async () => {
    const user = userEvent.setup();

    render(
      <JsonViewer title="Response" value={{ jsonrpc: "2.0", result: "ok" }} />,
    );

    expect(screen.getByText(/"result": "ok"/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Response" }));

    expect(screen.queryByText(/"result": "ok"/)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Response" }));

    expect(screen.getByText(/"result": "ok"/)).toBeInTheDocument();
  });
});
