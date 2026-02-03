/**
 * MCP Tool Whitelist Configuration
 *
 * This defines which tools are allowed for each MCP server handle.
 * Format: { "server-handle": ["tool1", "tool2", ...] } or { "server-handle": "*" }
 *
 * If a server handle is not listed here, NO tools will be allowed (secure by default).
 * If a server handle is listed with an empty array, no tools will be allowed.
 * If a server handle is set to '*', ALL tools will be allowed.
 * Otherwise, explicitly list the tools in the whitelist array.
 */
export const MCP_TOOL_WHITELIST: Record<string, string[] | '*'> = {
  'for-testing-only': ['getCount'],
  'disabled-server': [],
  common: '*',
  google_sheets: [
    // 'google_sheets_create_spreadsheet',
    // 'google_sheets_write_to_cell',
    'google_sheets_get_spreadsheet',
    'google_sheets_list_all_sheets',
    'google_sheets_list_spreadsheets',
  ],
};

/**
 * Get whitelisted tools for a specific server handle
 */
export function getWhitelistedTools(
  serverHandle: string,
): string[] | '*' | null {
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

  // If no whitelist exists, deny all tools (secure by default)
  if (!whitelistedTools) {
    return false;
  }

  // If wildcard '*' is set, allow all tools
  if (whitelistedTools === '*') {
    return true;
  }

  return whitelistedTools.includes(toolName);
}
