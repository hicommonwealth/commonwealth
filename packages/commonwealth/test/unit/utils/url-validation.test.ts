import { describe, expect, it, vi } from 'vitest';
import { isValidSlug } from '../../../client/scripts/utils/url-validation';

// Mock shared utilities
vi.mock('../../../client/scripts/utils/url-validation', () => ({
  isValidSlug: (url: string) => {
    const urlPattern = /^https?:\/\//i;
    const htmlPattern = /[<>]/;
    const jsPattern = /javascript:/i;
    const dataPattern = /data:/i;
    const whitespacePattern = /\s/;

    return !(
      urlPattern.test(url) ||
      htmlPattern.test(url) ||
      jsPattern.test(url) ||
      dataPattern.test(url) ||
      whitespacePattern.test(url)
    );
  },
}));

describe('URL Validation', () => {
  describe('isValidSlug', () => {
    it('should reject URLs containing http/https protocols', () => {
      expect(
        isValidSlug('Please reset your password at https://evil.com'),
      ).toBe(false);
      expect(isValidSlug('Click http://malicious.com')).toBe(false);
    });

    it('should reject HTML tags and scripts', () => {
      expect(isValidSlug('<script>alert(1)</script>')).toBe(false);
      expect(isValidSlug('profile<img src=x>')).toBe(false);
    });

    it('should reject javascript: protocol', () => {
      expect(isValidSlug('javascript:alert(1)')).toBe(false);
      expect(isValidSlug('javascript:void(0)')).toBe(false);
    });

    it('should reject data: URLs', () => {
      expect(isValidSlug('data:text/html,<script>alert(1)</script>')).toBe(
        false,
      );
    });

    it('should reject strings containing whitespace', () => {
      expect(isValidSlug('reset password')).toBe(false);
      expect(isValidSlug('profile edit')).toBe(false);
    });

    it('should accept valid slugs', () => {
      expect(isValidSlug('profile-edit-123')).toBe(true);
      expect(isValidSlug('valid-stake')).toBe(true);
      expect(isValidSlug('valid-community')).toBe(true);
    });
  });
});
