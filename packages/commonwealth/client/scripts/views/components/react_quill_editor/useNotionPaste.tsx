import { useEffect } from 'react';

export const useNotionPaste = (setContentDelta, editorRef) => {
  useEffect(() => {
    let isHandlingPaste = false;

    const handlePaste = (event) => {
      if (!isHandlingPaste) {
        isHandlingPaste = true;

        const pastedText = event.clipboardData.getData('text');
        if (pastedText) {
          const lines = pastedText.split('\n');
          const fixedLines = lines.map((line) => {
            if (line.trim().startsWith('[ ]')) {
              return `- ${line.trim()}`;
            }
            return line;
          });
          const fixedText = fixedLines.join('\n');
          setContentDelta((prevDelta) => ({
            ...prevDelta,
            ops: [
              ...prevDelta.ops,
              {
                insert: fixedText,
              },
            ],
          }));

          if (editorRef.current) {
            const editor = editorRef.current.getEditor();
            const container = editor.getModule('scroll')['domNode'];
            container.scrollTop =
              container.scrollHeight + container.clientHeight;
          }

          event.preventDefault();
        }

        isHandlingPaste = false;
      }
    };

    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [setContentDelta, editorRef]);
};
