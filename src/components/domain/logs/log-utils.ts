import type { McpMethod } from "@/components/domain/shared/MethodBadge";

const MCP_METHODS = new Set<McpMethod>([
  "initialize",
  "tools/list",
  "tools/call",
]);

export const isMcpMethod = (method: string): method is McpMethod =>
  MCP_METHODS.has(method as McpMethod);

export const formatDeploymentLabel = (
  deploymentId: string,
  versionById: Map<string, string>,
) => versionById.get(deploymentId) ?? deploymentId.replace(/^dep_/, "");

export const matchesToolNameFilter = (pattern: string, toolName: string) => {
  try {
    return new RegExp(pattern, "i").test(toolName);
  } catch {
    return false;
  }
};
