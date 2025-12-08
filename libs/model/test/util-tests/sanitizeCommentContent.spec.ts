import { describe, expect, test } from 'vitest';
import { sanitizeCommentContent } from '../../src/aggregates/comment/CreateAICompletionToken.command';

describe('sanitizeCommentContent', () => {
  test('should convert markdown link to plain text', () => {
    const input =
      'hey [/Google Sheets](/mcp-server/google_sheets/16) list your sheets';
    const expected = 'hey Google Sheets list your sheets';
    expect(sanitizeCommentContent(input)).toBe(expected);
  });

  test('should remove leading slash from link text', () => {
    const input = '[/Some Tool](/path/to/tool)';
    const expected = 'Some Tool';
    expect(sanitizeCommentContent(input)).toBe(expected);
  });

  test('should handle link text without leading slash', () => {
    const input = '[Google Sheets](/mcp-server/google_sheets/16)';
    const expected = 'Google Sheets';
    expect(sanitizeCommentContent(input)).toBe(expected);
  });

  test('should handle multiple markdown links', () => {
    const input = 'Use [/Tool A](/path/a) and [/Tool B](/path/b) together';
    const expected = 'Use Tool A and Tool B together';
    expect(sanitizeCommentContent(input)).toBe(expected);
  });

  test('should return unchanged text when no markdown links present', () => {
    const input = 'This is plain text without any links';
    expect(sanitizeCommentContent(input)).toBe(input);
  });

  test('should handle empty string', () => {
    expect(sanitizeCommentContent('')).toBe('');
  });

  test('should handle text with parentheses that are not markdown links', () => {
    const input = 'Call function(arg) and (another thing)';
    expect(sanitizeCommentContent(input)).toBe(input);
  });

  test('should handle text with brackets that are not markdown links', () => {
    const input = 'Array [0] and [1] values';
    expect(sanitizeCommentContent(input)).toBe(input);
  });
});
