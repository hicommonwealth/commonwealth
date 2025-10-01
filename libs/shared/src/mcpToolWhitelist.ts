/**
 * MCP Tool Whitelist Configuration
 *
 * This defines which tools are allowed for each MCP server handle.
 * Format: { "server-handle": ["tool1", "tool2", ...] }
 *
 * If a server handle is not listed here, all tools will be allowed (backward compatibility).
 * If a server handle is listed with an empty array, no tools will be allowed.
 */
export const MCP_TOOL_WHITELIST: Record<string, string[]> = {
  // Commonwealth API Server
  'commonwealth-api': [
    'getCommunityThreads',
    'getCommunityUsers',
    'createThread',
    'getThreadComments',
    'searchCommunities',
    'getUserProfile',
  ],

  // Google Sheets Integration
  'google-sheets': ['readSheet', 'writeSheet', 'createSheet', 'getSheetInfo'],

  // Klavis Marketing Integration
  'klavis-integration': [
    'getCustomerData',
    'createSegment',
    'sendEmail',
    'getEmailMetrics',
  ],

  // Example: Restricted server with limited tools
  'restricted-server': ['readOnlyTool'],

  // Example: Completely disabled server
  'disabled-server': [],

  // Add more server configurations as needed...
};

/**
 * Get whitelisted tools for a specific server handle
 */
export function getWhitelistedTools(serverHandle: string): string[] | null {
  return MCP_TOOL_WHITELIST[serverHandle] || null;
}

/**
 * Check if a tool is whitelisted for a server
 */
export function isToolWhitelisted(
  serverHandle: string,
  toolName: string,
): boolean {
  const whitelistedTools = getWhitelistedTools(serverHandle);

  // If no whitelist exists, allow all tools (backward compatibility)
  if (!whitelistedTools) {
    return true;
  }

  return whitelistedTools.includes(toolName);
}
