import m from 'mithril';

import { MarkdownFormattedText } from './markdown_formatted_text';
import { QuillFormattedText } from './quill_formatted_text';

export const editorIsBlank = (quillEditorState) => {
  // No active editor, treat as blank form
  if (!quillEditorState?.editor?.editor) return true;
  return quillEditorState.editor.editor.isBlank();
};

export const disableEditor = (quillEditorState, document?) => {
  // Disable main editor
  if (!quillEditorState?.editor?.editor) return;
  quillEditorState.editor.enable(false);

  // Disable mentions container
  if (!document) return;
  const mentionsEle = document.getElementsByClassName(
    'ql-mention-list-container'
  )[0];
  if (mentionsEle) {
    (mentionsEle as HTMLElement).style.visibility = 'hidden';
  }
};

export const enableEditor = (quillEditorState) => {
  if (!quillEditorState?.editor?.editor) return;
  quillEditorState.editor.enable(true);
};

export const getQuillTextContents = (quillEditorState) => {
  if (!quillEditorState) return '';
  return quillEditorState.markdownMode
    ? quillEditorState.editor.getText()
    : JSON.stringify(quillEditorState.editor.getContents());
};

type QuillTextParams = {
  collapse?: boolean;
  cutoffText?: number;
  hideFormatting?: boolean;
  openLinkInNewTab?: boolean;
  searchTerm?: string;
};

// TODO Graham 22-6-5: Add option to trim doc to param length
// (will allow us to use helper for previews, drafts, etc)
export const renderQuillTextBody = (textBody: any, params: QuillTextParams) => {
  try {
    const doc = JSON.parse(decodeURIComponent(textBody));
    if (!doc.ops) throw new Error();
    return m(QuillFormattedText, { ...params, doc });
  } catch (e) {
    const doc = decodeURIComponent(textBody);
    return m(MarkdownFormattedText, { ...params, doc });
  }
};
