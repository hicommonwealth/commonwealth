import m from 'mithril';

import { MarkdownFormattedText } from './markdown_formatted_text';
import { QuillFormattedText, QuillTextParams } from './quill_formatted_text';
import { DeltaOps } from './types';

export const countLinesQuill = (ops: DeltaOps[]) => {
  let count = 0;

  for (const op of ops) {
    if (typeof op.insert === 'string') {
      try {
        count += op.insert.split('\n').length - 1;
      } catch (e) {
        console.log(e);
      }
    }
  }

  return count;
};

export const countLinesMarkdown = (text: string) => {
  return text.split('\n').length - 1;
};

// TODO Graham 22-6-5: Add option to trim doc to param length
// (will allow us to use helper for previews, drafts, etc)
export const renderQuillTextBody = (textBody: any, params: QuillTextParams) => {
  try {
    const doc = JSON.parse(decodeURIComponent(textBody));
    if (!doc.ops) throw new Error();
    return m(QuillFormattedText, { ...params, doc });
  } catch (e) {
    let doc;
    try {
      doc = decodeURIComponent(textBody);
    } catch (e2) {
      return m(MarkdownFormattedText, { ...params, textBody });
    }
    return m(MarkdownFormattedText, { ...params, doc });
  }
};
