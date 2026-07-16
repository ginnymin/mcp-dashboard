export const formatSessionDuration = (
  startedAt: string,
  endedAt: string | null,
) => {
  if (!endedAt) {
    return "—";
  }

  const durationMs = Date.parse(endedAt) - Date.parse(startedAt);

  if (Number.isNaN(durationMs) || durationMs < 0) {
    return "—";
  }

  const totalMinutes = Math.floor(durationMs / 60_000);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

export const matchesClientNameFilter = (
  pattern: string,
  clientName: string,
) => {
  try {
    return new RegExp(pattern, "i").test(clientName);
  } catch {
    return false;
  }
};
