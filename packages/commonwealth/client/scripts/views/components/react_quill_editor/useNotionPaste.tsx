import { useEffect } from 'react';

export const useNotionPaste = (setContentDelta, contentDelta, editorRef) => {
  useEffect(() => {
    const handlePaste = (event) => {
      event.preventDefault();
      const editor = editorRef.current?.getEditor();
      const pastedText = event.clipboardData.getData('text/plain');
      if (pastedText) {
        const lines = pastedText.split('\n');
        const fixedLines = lines.map((line) => {
          if (line.trim().startsWith('[ ]')) {
            return `- ${line.trim()}`;
          }
          return line;
        });
        const fixedText = fixedLines.join('\n');

        if (fixedText !== contentDelta.ops[0]?.insert) {
          setContentDelta((prevDelta) => ({
            ...prevDelta,
            ops: [
              ...prevDelta.ops,
              {
                insert: fixedText,
              },
            ],
          }));

          //Setting a delay to reset cursor position
          setTimeout(() => {
            const newCursorPosition = editor.getLength();
            editor.setSelection(newCursorPosition, newCursorPosition);
          }, 10);
        }
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [setContentDelta, editorRef, contentDelta]);
};
