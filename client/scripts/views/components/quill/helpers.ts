export const editorIsBlank = (quillEditorState) => {
  return quillEditorState.editor.editor.isBlank();
};

export const disableEditor = (quillEditorState) => {
  quillEditorState.editor.enable(false);
};

export const getTextContents = (quillEditorState) => {
  if (!quillEditorState) return '';
  return quillEditorState.markdownMode
    ? quillEditorState.editor.getText()
    : JSON.stringify(quillEditorState.editor.getContents());
};
