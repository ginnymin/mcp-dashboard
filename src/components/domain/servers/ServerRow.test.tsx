import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ServerRow } from "./ServerRow";
import { Table, TableBody } from "@/components/ui/Table";
import serversFixture from "@/test/fixtures/servers.json";
import type { Server } from "@/lib/api/types";

const server = serversFixture.data[0] as Server;

const renderServerRow = (onSelect = vi.fn(), isSelected = false) => {
  render(
    <Table>
      <TableBody>
        <ServerRow
          server={server}
          isSelected={isSelected}
          onSelect={onSelect}
        />
      </TableBody>
    </Table>,
  );

  return {
    onSelect,
    row: screen.getByRole("link", { name: "View Weather Tools" }),
  };
};

describe("ServerRow", () => {
  it("includes server-row group hover classes", () => {
    const { row } = renderServerRow();

    expect(row.className).toContain("group/server-row");
    expect(row.className).toContain("hover:bg-panel-2");
    expect(row.className).toContain("active:bg-panel-3");
  });

  it("activates on Enter key", () => {
    const onSelect = vi.fn();
    const { row } = renderServerRow(onSelect);

    fireEvent.keyDown(row, { key: "Enter" });

    expect(onSelect).toHaveBeenCalledWith("srv_weather");
  });

  it("activates on click", () => {
    const onSelect = vi.fn();
    const { row } = renderServerRow(onSelect);

    fireEvent.click(row);

    expect(onSelect).toHaveBeenCalledWith("srv_weather");
  });

  it("applies selected styling when isSelected is true", () => {
    const { row } = renderServerRow(vi.fn(), true);

    expect(row).toHaveAttribute("data-state", "selected");
    expect(row).toHaveAttribute("aria-current", "true");
    expect(row.className).toContain("data-[state=selected]:bg-panel-3");
  });
});
