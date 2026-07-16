import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export const useRefreshCurrentView = () => {
  const queryClient = useQueryClient();

  const refresh = useCallback(
    () => queryClient.refetchQueries({ type: "active" }),
    [queryClient],
  );

  return { refresh };
};
