import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { apiGet, ApiError } from "./client";
import { server } from "@/test/setup";
import serversFixture from "@/test/fixtures/servers.json";

describe("apiGet", () => {
  it("fetches mocked servers via MSW", async () => {
    const result = await apiGet<typeof serversFixture>("/servers");

    expect(result.total).toBe(serversFixture.total);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].display_name).toBe("Weather Tools");
  });

  it("throws ApiError on 404 with message from body", async () => {
    server.use(
      http.get("/api/servers/missing", () =>
        HttpResponse.json({ error: "Server not found" }, { status: 404 }),
      ),
    );

    await expect(apiGet("/servers/missing")).rejects.toSatisfy((error) => {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
      expect((error as ApiError).message).toBe("Server not found");

      return true;
    });
  });
});
