import { describe, expect, it } from "vitest";
import { sortServers } from "./server-list-utils";
import type { Server } from "@/lib/api/types";

const baseServer: Server = {
  id: "srv_a",
  name: "alpha",
  display_name: "Alpha",
  description: null,
  status: "active",
  source_type: "github",
  source: {},
  auth_enabled: false,
  auth_policy: null,
  audit_enabled: false,
  rate_limit_enabled: false,
  rate_limit_rpm: null,
  current_deployment_id: null,
  created_at: "2026-06-01T00:00:00.000Z",
  error_rate_24h: 2,
  open_session_count: 1,
};

const servers: Server[] = [
  baseServer,
  {
    ...baseServer,
    id: "srv_b",
    name: "beta",
    display_name: "Beta",
    error_rate_24h: 0.5,
    open_session_count: 5,
  },
];

describe("sortServers", () => {
  it("sorts by name ascending", () => {
    expect(
      sortServers(servers, "name", "asc").map((server) => server.id),
    ).toEqual(["srv_a", "srv_b"]);
  });

  it("sorts by error rate descending", () => {
    expect(
      sortServers(servers, "error_rate", "desc").map((server) => server.id),
    ).toEqual(["srv_a", "srv_b"]);
  });

  it("treats null error rates as 0% when sorting", () => {
    const withNull: Server[] = [
      { ...baseServer, id: "srv_high", error_rate_24h: 5 },
      { ...baseServer, id: "srv_null", error_rate_24h: null },
      { ...baseServer, id: "srv_low", error_rate_24h: 0.1 },
    ];

    expect(
      sortServers(withNull, "error_rate", "asc").map((server) => server.id),
    ).toEqual(["srv_null", "srv_low", "srv_high"]);

    expect(
      sortServers(withNull, "error_rate", "desc").map((server) => server.id),
    ).toEqual(["srv_high", "srv_low", "srv_null"]);
  });
});
