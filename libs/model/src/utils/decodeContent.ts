// @ts-expect-error quill-delta-to-markdown doesn't have types
import { deltaToMarkdown } from 'quill-delta-to-markdown';

export function decodeContent(content: string) {
  // decode if URI encoded
  let decodedContent: string;
  try {
    decodedContent = decodeURIComponent(content);
  } catch {
    decodedContent = content;
  }

  // convert to Markdown if Quill Delta format
  let rawMarkdown: string;
  try {
    const delta = JSON.parse(decodedContent);
    if ('ops' in delta) {
      rawMarkdown = deltaToMarkdown(delta.ops);
    } else {
      rawMarkdown = delta;
    }
  } catch (e) {
    rawMarkdown = decodedContent;
  }

  return rawMarkdown.trim();
}
