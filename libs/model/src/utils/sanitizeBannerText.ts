import sanitizeHtml from 'sanitize-html';

/**
 * Configuration for sanitizing community banner text.
 *
 * The banner should only support basic text formatting - no images, embeds,
 * or other content that could:
 * - Disrupt page layout with large elements
 * - Make external requests that could track user IP addresses
 * - Execute scripts or other potentially harmful content
 *
 * Allowed tags are restricted to basic text formatting only:
 * - Text formatting: b, strong, i, em, u, s, strike
 * - Structure: p, br, span
 * - Links: a (with href only, validated to prevent javascript: URLs)
 */
const BANNER_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    // Text formatting
    'b',
    'strong',
    'i',
    'em',
    'u',
    's',
    'strike',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    // Structure
    'p',
    'br',
    'span',
    'div',
    // Links (limited attributes)
    'a',
  ],
  allowedAttributes: {
    // Only allow href on anchor tags, no other attributes
    a: ['href'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  // Disallow any potentially dangerous URL schemes
  disallowedTagsMode: 'discard',
  // Transform tags to ensure safety
  transformTags: {
    // Ensure all links open safely
    a: (
      tagName: string,
      attribs: sanitizeHtml.Attributes,
    ): sanitizeHtml.Tag => {
      // Validate href to prevent javascript: and other dangerous schemes
      const href = attribs.href || '';
      const lowerHref = href.toLowerCase().trim();

      // Block javascript:, data:, vbscript:, and other potentially dangerous schemes
      if (
        lowerHref.startsWith('javascript:') ||
        lowerHref.startsWith('data:') ||
        lowerHref.startsWith('vbscript:')
      ) {
        return {
          tagName: 'span',
          attribs: {},
        };
      }

      return {
        tagName: 'a',
        attribs: {
          href: attribs.href,
        },
      };
    },
  },
};

/**
 * Sanitizes community banner text
 *
 * Only allows basic text formatting tags: b, strong, i, em, u, s, p, br, span, a
 *
 * @param bannerText - The raw banner text input from the user
 * @returns Sanitized banner text safe for display
 */
export function sanitizeBannerText(bannerText: string): string {
  if (!bannerText) {
    return '';
  }

  return sanitizeHtml(bannerText, BANNER_SANITIZE_OPTIONS);
}
