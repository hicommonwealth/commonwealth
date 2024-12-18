/**
 * Extracts image URLs from a given text string formatted with Markdown syntax.
 * The function looks for patterns that match the Markdown image syntax:
 * ![image](<url>), where <url> is a valid HTTPS URL. It returns an array
 * of extracted image URLs.
 */
export const extractImages = (text: string) => {
  const urlPattern = /!\[image\]\((https:\/\/[^\s]+)\)/g;
  return Array.from(text.matchAll(urlPattern), (match) => match[1]);
};
