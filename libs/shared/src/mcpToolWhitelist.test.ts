import { describe, expect, test } from 'vitest';
import {
  MCP_TOOL_WHITELIST,
  getWhitelistedTools,
  isToolWhitelisted,
} from './mcpToolWhitelist';

describe('MCP Tool Whitelist', () => {
  test('should return whitelisted tools for known server', () => {
    const tools = getWhitelistedTools('commonwealth-api');
    expect(tools).toContain('getCommunityThreads');
    expect(tools).toContain('getCommunityUsers');
  });

  test('should return null for unknown server', () => {
    const tools = getWhitelistedTools('unknown-server');
    expect(tools).toBeNull();
  });

  test('should return empty array for disabled server', () => {
    const tools = getWhitelistedTools('disabled-server');
    expect(tools).toEqual([]);
  });

  test('should check if tool is whitelisted correctly', () => {
    expect(isToolWhitelisted('commonwealth-api', 'getCommunityThreads')).toBe(
      true,
    );
    expect(isToolWhitelisted('commonwealth-api', 'nonExistentTool')).toBe(
      false,
    );
    expect(isToolWhitelisted('unknown-server', 'anyTool')).toBe(true); // backward compatibility
    expect(isToolWhitelisted('disabled-server', 'anyTool')).toBe(false);
  });

  test('should have expected structure in whitelist', () => {
    expect(MCP_TOOL_WHITELIST).toHaveProperty('commonwealth-api');
    expect(MCP_TOOL_WHITELIST).toHaveProperty('google-sheets');
    expect(MCP_TOOL_WHITELIST).toHaveProperty('klavis-integration');
    expect(Array.isArray(MCP_TOOL_WHITELIST['commonwealth-api'])).toBe(true);
  });
});
