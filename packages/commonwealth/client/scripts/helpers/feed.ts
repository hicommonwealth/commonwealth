import { isValidImageUrl } from '@hicommonwealth/shared';

/**
 * Extracts image URLs from a given text string formatted with Markdown syntax.
 * The function looks for patterns that match the Markdown image syntax:
 * ![image](<url>), where <url> is a valid HTTPS URL. It returns an array
 * of extracted image URLs.
 *
 * Only images with valid extensions (jpg, png, gif, webp, etc.) and HTTPS URLs are returned.
 */
export const extractImages = (text: string): string[] => {
  if (!text) {
    return [];
  }
  const urlPattern = /!\[image\]\((https:\/\/[^\s)]+)\)/g;
  const matches = Array.from(text.matchAll(urlPattern), (match) => match[1]);

  return matches.filter((url) => isValidImageUrl(url));
};
