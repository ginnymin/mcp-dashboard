const TRAFFIC_WINDOW_MS = 15 * 60 * 1000;

export const AUDIT_EVENT_TYPE_OPTIONS = [
  { value: "deployment.created", label: "Deployment created" },
  { value: "deployment.rolled_back", label: "Deployment rolled back" },
  { value: "api_key.rotated", label: "API key rotated" },
  { value: "rate_limit.changed", label: "Rate limit changed" },
  { value: "auth_policy.changed", label: "Auth policy changed" },
] as const;

export const formatEventTypeLabel = (eventType: string) => {
  const match = AUDIT_EVENT_TYPE_OPTIONS.find(
    (option) => option.value === eventType,
  );

  if (match) {
    return match.label;
  }

  return eventType.replaceAll(".", " ");
};

export const computeTrafficWindow = (ts: string) => {
  const center = Date.parse(ts);

  return {
    since: new Date(center - TRAFFIC_WINDOW_MS).toISOString(),
    until: new Date(center + TRAFFIC_WINDOW_MS).toISOString(),
  };
};
