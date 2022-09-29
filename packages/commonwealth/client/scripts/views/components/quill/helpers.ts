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

// TODO Graham 2022.06.05: Add option to trim doc to param length
// (will allow us to use helper for previews, drafts, etc)

// TODO Graham 2022.09.22: Investigate when and why decodeURIComponent fails,
// and build a more reliable and transparent system for saving & rendering,
// encoding and decoding
export const renderQuillTextBody = (textBody: any, params: QuillTextParams) => {
  let decodedTextbody: string;
  try {
    decodedTextbody = decodeURIComponent(textBody);
  } catch (e) {
    decodedTextbody = textBody;
  }

  try {
    const doc = JSON.parse(decodedTextbody);
    if (!doc.ops) throw new Error();
    return m(QuillFormattedText, { ...params, doc });
  } catch (e) {
    return m(MarkdownFormattedText, { ...params, doc: decodedTextbody });
  }
};
