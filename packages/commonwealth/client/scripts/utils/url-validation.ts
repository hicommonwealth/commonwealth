import { getDecodedString } from '@hicommonwealth/shared';

/**
 * Regular expressions to detect potentially malicious URL patterns
 */
const MALICIOUS_PATTERNS = [
  /https?:\/\//i, // URLs that could be used for phishing
  /[<>]/, // HTML tags that could be used for XSS
  /javascript:/i, // JavaScript protocol handlers
  /data:/i, // Data URLs that could contain malicious content
  /\s/, // Whitespace that could be used to obscure malicious content
];

/**
 * Validates a URL slug to prevent security vulnerabilities in page headers
 * @param slug The URL slug to validate
 * @returns boolean indicating if the slug is safe to display
 */
export const isValidSlug = (slug: string): boolean => {
  if (!slug) return false;
  const decodedSlug = getDecodedString(slug);
  return !MALICIOUS_PATTERNS.some((pattern) => pattern.test(decodedSlug));
};
