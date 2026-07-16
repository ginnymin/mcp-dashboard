import { act, renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useUrlFilters } from "./useUrlFilters";
import { logFilterDefaults, logFilterSchema } from "@/lib/url-state";

const SearchParamsReader = ({
  onChange,
}: {
  onChange: (value: string) => void;
}) => {
  const [searchParams] = useSearchParams();
  onChange(searchParams.toString());

  return null;
};

describe("useUrlFilters", () => {
  it("keeps earlier patches when a later patch is applied", async () => {
    let latestSearch = "";

    const { result } = renderHook(
      () => useUrlFilters(logFilterSchema, logFilterDefaults),
      {
        wrapper: ({ children }) => (
          <MemoryRouter
            initialEntries={[
              "/logs?since=2026-06-10T00:00:00.000Z&until=2026-06-18T00:00:00.000Z",
            ]}
          >
            <Routes>
              <Route
                path="/logs"
                element={
                  <>
                    <SearchParamsReader
                      onChange={(value) => {
                        latestSearch = value;
                      }}
                    />
                    {children}
                  </>
                }
              />
            </Routes>
          </MemoryRouter>
        ),
      },
    );

    act(() => {
      result.current.setFilters({
        serverId: "srv_weather",
        deploymentId: undefined,
        offset: 0,
      });
    });

    act(() => {
      result.current.setFilters({ sessionId: "ses_test001", offset: 0 });
    });

    await waitFor(() => {
      expect(latestSearch).toContain("serverId=srv_weather");
      expect(latestSearch).toContain("sessionId=ses_test001");
    });
  });
});
