import m from 'mithril';

import { MarkdownFormattedText } from './markdown_formatted_text';
import { QuillFormattedText, QuillTextParams } from './quill_formatted_text';

export const editorIsBlank = (quillEditorState) => {
  // No active editor, treat as blank form
  if (!quillEditorState?.editor?.editor) return true;

  const { editor } = quillEditorState.editor;

  if (editor.isBlank()) return true;

  if (
    editor.getText() === '' &&
    editor.getDelta()?.ops.length === 1 &&
    editor.getDelta()?.ops[0]?.insert === '\n'
  ) {
    return true;
  }

  return false;
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

export const countLinesQuill = (ops) => {
  let count = 0;

  for (const op of ops) {
    try {
      count += op.insert.split('\n').length - 1;
    } catch (e) {
      console.log(e);
    }
  }

  return count;
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
