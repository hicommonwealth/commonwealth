import { describe, expect, test } from 'vitest';
import {
  MCP_TOOL_WHITELIST,
  getWhitelistedTools,
  isToolWhitelisted,
} from './mcpToolWhitelist';

describe('MCP Tool Whitelist', () => {
  test('should return whitelisted tools for known server', () => {
    const tools = getWhitelistedTools('for-testing-only');
    expect(tools).toContain('getCount');
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
    expect(isToolWhitelisted('for-testing-only', 'getCount')).toBe(true);
    expect(isToolWhitelisted('for-testing-only', 'nonExistentTool')).toBe(
      false,
    );
    expect(isToolWhitelisted('unknown-server', 'anyTool')).toBe(false);
    expect(isToolWhitelisted('disabled-server', 'anyTool')).toBe(false);
  });

  test('should have expected structure in whitelist', () => {
    expect(MCP_TOOL_WHITELIST).toHaveProperty('for-testing-only');
    expect(MCP_TOOL_WHITELIST).toHaveProperty('disabled-server');
    expect(Array.isArray(MCP_TOOL_WHITELIST['for-testing-only'])).toBe(true);
  });
});
