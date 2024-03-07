import { Dispatch, SetStateAction, useEffect } from 'react';
import type { SerializableDeltaStatic } from './utils';

export const useNotionPaste = (
  setContentDelta: Dispatch<SetStateAction<SerializableDeltaStatic>>,
  contentDelta: SerializableDeltaStatic,
  editorRef,
  isEditorFocused: boolean,
) => {
  useEffect(() => {
    const editor = editorRef.current?.getEditor();
    const handlePaste = (event) => {
      if (!isEditorFocused) return;
      event.preventDefault();
      const pastedText = event.clipboardData.getData('text/plain');

      if (pastedText) {
        setContentDelta((prevContentDelta) => {
          return {
            ...prevContentDelta,
            ops: [
              ...prevContentDelta.ops,
              {
                insert: pastedText,
              },
            ],
            ___isMarkdown: true,
          };
        });

        setTimeout(() => {
          const newCursorPosition = editor.getLength() - 1;
          editor.setSelection(newCursorPosition, newCursorPosition);
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
