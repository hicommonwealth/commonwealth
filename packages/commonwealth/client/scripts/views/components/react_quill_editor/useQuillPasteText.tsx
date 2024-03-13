import { Dispatch, SetStateAction, useEffect } from 'react';
import ReactQuill from 'react-quill';
import type { SerializableDeltaStatic } from './utils';

/**
 * Helper function to eliminate extra new lines when pasting text
 * Since when you copy from Quill it adds n * 2 \n characters
 * This function will just reverse that n / 2
 * @param clipboardContents The content obtained from the clipboard.
 * @returns The modified content with consecutive newline characters halved.
 */
const handleTextPaste = (clipboardContents: string) => {
  if (typeof clipboardContents === 'string') {
    const modifiedContent = clipboardContents.replace(/\n{2,}/g, (match) => {
      if (match.length === 2) {
        return match;
      }
      const halfLength = Math.ceil(match.length / 2);
      return '\n'.repeat(halfLength);
    });
    return modifiedContent;
  }
  return clipboardContents;
};

/**
 * Custom hook to handle pasting text in a React Quill editor.
 * @param setContentDelta Function to set the content of the editor and sends state up to the parent.
 * @param contentDelta The current content of the editor.
 * @param editorRef Ref to the React Quill editor sent down from parent.
 * @param isEditorFocused Boolean indicating whether the editor is currently focused.
 */
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
      const pastedText = handleTextPaste(
        event.clipboardData.getData('text/plain'),
      );

      // Trick to get current cursor position
      const selection = editor.getSelection(true);

      if (pastedText) {
        editor.insertText(selection.index, pastedText, 'user');

        setTimeout(() => {
          const newCursorPosition = selection.index + pastedText.length;
          editor.setSelection(newCursorPosition as number, 0, 'silent');
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
