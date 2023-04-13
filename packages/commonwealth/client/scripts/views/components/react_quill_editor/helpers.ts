import { render } from 'mithrilInterop';

import { MarkdownFormattedText } from '../quill/markdown_formatted_text';
import { QuillFormattedText } from './quill_formatted_text';

// TODO: Replace instances of this with QuillRenderer, which handles both richtext and markdown
export const renderQuillTextBody = (
  textBody: any,
  params?: QuillTextParams
) => {
  let decodedTextbody: string;
  try {
    decodedTextbody = decodeURIComponent(textBody);
  } catch (e) {
    decodedTextbody = textBody;
  }

  try {
    const doc = JSON.parse(decodedTextbody);
    if (!doc.ops) throw new Error();
    return render(QuillFormattedText, { ...params, doc });
  } catch (e) {
    return render(MarkdownFormattedText, { ...params, doc: decodedTextbody });
  }
};
