import { useEffect } from 'react';

export const useNotionPaste = (setContentDelta, contentDelta, editorRef) => {
  useEffect(() => {
    const handlePaste = (event) => {
      event.preventDefault();
      const editor = editorRef.current?.getEditor();
      const pastedText = event.clipboardData.getData('text/plain');

      if (pastedText) {
        setContentDelta({
          ops: [
            {
              insert: pastedText,
            },
          ],
        });
        setTimeout(() => {
          const newCursorPosition = editor.getLength();
          editor.setSelection(newCursorPosition, newCursorPosition);
        }, 10);
        return;
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [setContentDelta, editorRef, contentDelta]);
};
