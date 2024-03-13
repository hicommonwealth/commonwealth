import { Dispatch, SetStateAction, useEffect } from 'react';
import ReactQuill from 'react-quill';
import type { SerializableDeltaStatic } from './utils';

export const useQuillPasteText = (
  setContentDelta: Dispatch<SetStateAction<SerializableDeltaStatic>>,
  contentDelta: SerializableDeltaStatic,
  editorRef: React.RefObject<ReactQuill>,
  isEditorFocused: boolean,
) => {
  useEffect(() => {
    const editor = editorRef?.current?.getEditor();

    if (!editor) return;
    const handlePaste = (event) => {
      if (!isEditorFocused) return;
      event.preventDefault();
      const pastedText = event.clipboardData.getData('text/plain');

      //Trick to get current cursor position
      const selection = editor.getSelection(true);

      if (pastedText) {
        editor.insertText(selection.index, pastedText, 'user');

        setTimeout(() => {
          editor.setSelection(selection.index + pastedText.length, 'silent');
        }, 10);
        return;
      }
    };

    const editorElement = editor.root;

    if (contentDelta) {
      editorElement.addEventListener('paste', handlePaste);

      return () => {
        editorElement.removeEventListener('paste', handlePaste);
      };
    }
  }, [setContentDelta, editorRef, contentDelta, isEditorFocused]);
};
