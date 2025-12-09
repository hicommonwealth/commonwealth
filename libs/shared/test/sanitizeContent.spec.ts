import { sanitizeContent } from '@hicommonwealth/shared';
import { describe, expect, test } from 'vitest';

describe('sanitizeContent', () => {
  test('should remove /number suffix from markdown link URL', () => {
    const input =
      'hey [/Google Sheets](/mcp-server/google_sheets/16) list your sheets';
    const expected =
      'hey [/Google Sheets](/mcp-server/google_sheets) list your sheets';
    expect(sanitizeContent(input)).toBe(expected);
  });

  test('should handle link without /number suffix (unchanged)', () => {
    const input = '[/Some Tool](/path/to/tool)';
    expect(sanitizeContent(input)).toBe(input);
  });

  test('should handle multiple markdown links with /number suffixes', () => {
    const input =
      'Use [/Tool A](/path/a/123) and [/Tool B](/path/b/456) together';
    const expected = 'Use [/Tool A](/path/a) and [/Tool B](/path/b) together';
    expect(sanitizeContent(input)).toBe(expected);
  });

  test('should return unchanged text when no markdown links present', () => {
    const input = 'This is plain text without any links';
    expect(sanitizeContent(input)).toBe(input);
  });

  test('should handle empty string', () => {
    expect(sanitizeContent('')).toBe('');
  });

  test('should handle text with parentheses that are not markdown links', () => {
    const input = 'Call function(arg) and (another thing)';
    expect(sanitizeContent(input)).toBe(input);
  });

  test('should handle text with brackets that are not markdown links', () => {
    const input = 'Array [0] and [1] values';
    expect(sanitizeContent(input)).toBe(input);
  });
});
